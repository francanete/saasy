import { inngest } from "./client";
import { db, users, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/email";
import { syncWithPolar } from "@/lib/subscription";

// ============ Constants ============

const BATCH_SIZE = 50;
const DELAY_BETWEEN_USERS_MS = 200; // ~5 requests/second
const DELAY_BETWEEN_BATCHES_MS = 5000; // 5 second pause between batches
const RATE_LIMIT_RETRY_DELAY_MS = 5000; // Wait 5s before retry on rate limit

// ============ Jobs ============

// Welcome email + FREE subscription after signup
export const welcomeEmailJob = inngest.createFunction(
  { id: "send-welcome-email" },
  { event: "user/created" },
  async ({ event }) => {
    const { userId, email } = event.data;

    // Create default FREE subscription for new user
    await db
      .insert(subscriptions)
      .values({
        userId,
        plan: "FREE",
        status: "ACTIVE",
        billingType: "none",
      })
      .onConflictDoNothing(); // In case webhook already created one

    // Get user name for email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Send welcome email
    await sendWelcomeEmail(email, user?.name || "there");

    return { sent: true, subscriptionCreated: true };
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
    const batches: { userId: string }[][] = [];
    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      batches.push(allUsers.slice(i, i + BATCH_SIZE));
    }

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
                await new Promise((r) =>
                  setTimeout(r, RATE_LIMIT_RETRY_DELAY_MS)
                );
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
            await new Promise((r) => setTimeout(r, DELAY_BETWEEN_USERS_MS));
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

export const functions = [welcomeEmailJob, syncAllSubscriptions];
