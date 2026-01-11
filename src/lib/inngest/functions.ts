import { inngest } from "./client";
import { db, users, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendAccountSetupEmail } from "@/lib/email";
import { sendSequenceEmail } from "@/lib/email-sequences";
import { syncWithPolar } from "@/lib/subscription";

// ============ Constants ============

const BATCH_SIZE = 50;
const DELAY_BETWEEN_USERS_MS = 200; // ~5 requests/second
const DELAY_BETWEEN_BATCHES_MS = 5000; // 5 second pause between batches
const RATE_LIMIT_RETRY_DELAY_MS = 5000; // Wait 5s before retry on rate limit

// ============ Helpers ============

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============ Jobs ============

// Welcome sequence: instant email + day 3 follow-up
export const welcomeSequenceJob = inngest.createFunction(
  { id: "welcome-sequence" },
  { event: "user/created" },
  async ({ event, step }) => {
    const { userId, email } = event.data;

    // Step 1: Create default FREE subscription for new user
    await step.run("create-subscription", async () => {
      await db
        .insert(subscriptions)
        .values({
          userId,
          plan: "FREE",
          status: "ACTIVE",
          billingType: "none",
        })
        .onConflictDoNothing(); // In case webhook already created one
    });

    // Step 2: Get user name for emails
    const user = await step.run("get-user", async () => {
      const [u] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return u;
    });

    // Step 3: Send instant welcome email
    const result1 = await step.run("send-welcome-instant", async () => {
      return sendSequenceEmail({
        userId,
        email,
        name: user?.name || null,
        emailKey: "welcome_instant",
      });
    });

    // Step 4: Wait 3 days
    await step.sleep("wait-day-3", "3d");

    // Step 5: Send day 3 follow-up email
    const result2 = await step.run("send-welcome-day3", async () => {
      return sendSequenceEmail({
        userId,
        email,
        name: user?.name || null,
        emailKey: "welcome_day3",
      });
    });

    return {
      email1: result1,
      email2: result2,
    };
  }
);

// Daily sync of ALL subscriptions with Polar (with batching and retry)
export const syncAllSubscriptions = inngest.createFunction(
  { id: "sync-all-subscriptions" },
  { cron: "0 3 * * *" }, // Every day at 3 AM
  async ({ step }) => {
    // Get ALL users with subscription records
    const allUsers = await step.run("fetch-users", async () => {
      return db.select({ userId: subscriptions.userId }).from(subscriptions);
    });

    // Split into batches
    const batches = chunkArray(allUsers, BATCH_SIZE);

    let synced = 0;
    let errors = 0;

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Process batch as a step (for resumability if job fails)
      const batchResult = await step.run(
        `sync-batch-${batchIndex}`,
        async () => {
          let batchSynced = 0;
          let batchErrors = 0;

          for (const user of batch) {
            try {
              await syncWithPolar(user.userId);
              batchSynced++;
            } catch (error: unknown) {
              const apiError = error as { status?: number };

              // Retry once on rate limit (429)
              if (apiError.status === 429) {
                await delay(RATE_LIMIT_RETRY_DELAY_MS);
                try {
                  await syncWithPolar(user.userId);
                  batchSynced++;
                } catch (retryError) {
                  console.error(
                    `Failed to sync user ${user.userId} after retry:`,
                    retryError
                  );
                  batchErrors++;
                }
              } else {
                console.error(`Failed to sync user ${user.userId}:`, error);
                batchErrors++;
              }
            }

            // Rate limit: delay between each user
            await delay(DELAY_BETWEEN_USERS_MS);
          }

          return { synced: batchSynced, errors: batchErrors };
        }
      );

      synced += batchResult.synced;
      errors += batchResult.errors;

      // Pause between batches (except after last batch)
      if (batchIndex < batches.length - 1) {
        await step.sleep("batch-cooldown", DELAY_BETWEEN_BATCHES_MS);
      }
    }

    return {
      total: allUsers.length,
      synced,
      errors,
      batches: batches.length,
    };
  }
);

// Account setup email for users who paid via guest checkout
export const paidSignupEmailJob = inngest.createFunction(
  { id: "send-paid-signup-email" },
  { event: "user/paid-signup" },
  async ({ event, step }) => {
    const { userId, email, name } = event.data;

    // Wait briefly for subscription to be created by webhook
    await step.sleep("wait-for-webhook", "1s");

    // Get subscription to know the plan
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const planName = subscription?.plan || "Premium";

    await sendAccountSetupEmail(email, name, planName);

    return { sent: true, plan: planName };
  }
);

export const functions = [
  welcomeSequenceJob,
  syncAllSubscriptions,
  paidSignupEmailJob,
];
