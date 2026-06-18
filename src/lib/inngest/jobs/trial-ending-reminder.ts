import { inngest } from "../client";
import { db, users, subscriptions } from "@/lib/db";
import { and, gte, lt, inArray } from "drizzle-orm";
import { sendTransactionalEmail } from "@/lib/email-sequences";
import { appConfig, type PaidTier } from "@/lib/config";
import {
  BATCH_SIZE,
  DELAY_BETWEEN_USERS_MS,
  DELAY_BETWEEN_BATCHES_MS,
  chunkArray,
  delay,
  formatPrice,
  formatDate,
} from "../helpers";

// Step type for testability (subset of Inngest step methods we use)
export type InngestStepLike = {
  run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  sleep: (name: string, duration: number) => Promise<void>;
};

// Extracted handler for testability
export async function trialEndingReminderHandler(step: InngestStepLike) {
  // Step 1: Find trials ending in 24-48 hours
  const trialsEndingSoon = await step.run("fetch-trials", async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return db
      .select({
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        nativeTrialEndsAt: subscriptions.nativeTrialEndsAt,
      })
      .from(subscriptions)
      .where(
        and(
          gte(subscriptions.nativeTrialEndsAt, windowStart),
          lt(subscriptions.nativeTrialEndsAt, windowEnd),
          inArray(subscriptions.billingType, ["none"])
        )
      );
  });

  if (trialsEndingSoon.length === 0) {
    return {
      sent: 0,
      skipped: 0,
      errors: 0,
      message: "No trials ending soon",
    };
  }

  // Step 2: Process in batches
  const batches = chunkArray(trialsEndingSoon, BATCH_SIZE);
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    const batchResult = await step.run(`send-batch-${batchIndex}`, async () => {
      let batchSent = 0;
      let batchSkipped = 0;
      let batchErrors = 0;

      // Batch query all users for this batch (fixes N+1 query)
      const userIds = batch.map((t) => t.userId);
      const usersData = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(inArray(users.id, userIds));
      const userMap = new Map(usersData.map((u) => [u.id, u]));

      for (const trial of batch) {
        try {
          const user = userMap.get(trial.userId);

          if (!user) {
            batchSkipped++;
            continue;
          }

          const planKey = trial.plan as PaidTier;
          const tierConfig = appConfig.pricing.tiers[planKey];
          const planName = tierConfig?.marketing.name || trial.plan;
          const price = tierConfig
            ? formatPrice(tierConfig.prices.monthly, "monthly")
            : "your subscription price";

          const endDate = trial.nativeTrialEndsAt
            ? formatDate(new Date(trial.nativeTrialEndsAt))
            : "soon";

          const result = await sendTransactionalEmail({
            userId: trial.userId,
            email: user.email,
            name: user.name,
            emailKey: "trial_ending_24h",
            templateData: {
              planName,
              endDate,
              price,
            },
          });

          if (result.sent) {
            batchSent++;
          } else {
            batchSkipped++;
          }
        } catch (error) {
          console.error(
            `Failed to send trial ending email for user ${trial.userId}:`,
            error
          );
          batchErrors++;
        }

        await delay(DELAY_BETWEEN_USERS_MS);
      }

      return {
        sent: batchSent,
        skipped: batchSkipped,
        errors: batchErrors,
      };
    });

    sent += batchResult.sent;
    skipped += batchResult.skipped;
    errors += batchResult.errors;

    if (batchIndex < batches.length - 1) {
      await step.sleep("batch-cooldown", DELAY_BETWEEN_BATCHES_MS);
    }
  }

  return {
    total: trialsEndingSoon.length,
    sent,
    skipped,
    errors,
    batches: batches.length,
  };
}

export const trialEndingReminderJob = inngest.createFunction(
  { id: "trial-ending-reminder" },
  { cron: "0 9 * * *" },
  async ({ step }) => trialEndingReminderHandler(step as InngestStepLike)
);
