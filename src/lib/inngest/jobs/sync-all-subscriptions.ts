import { inngest } from "../client";
import { db, subscriptions } from "@/lib/db";
import { syncWithPolar } from "@/lib/subscription";
import {
  BATCH_SIZE,
  DELAY_BETWEEN_USERS_MS,
  DELAY_BETWEEN_BATCHES_MS,
  RATE_LIMIT_RETRY_DELAY_MS,
  chunkArray,
  delay,
} from "../helpers";

export const syncAllSubscriptions = inngest.createFunction(
  { id: "sync-all-subscriptions" },
  { cron: "0 3 * * *" },
  async ({ step }) => {
    const allUsers = await step.run("fetch-users", async () => {
      return db.select({ userId: subscriptions.userId }).from(subscriptions);
    });

    const batches = chunkArray(allUsers, BATCH_SIZE);

    let synced = 0;
    let errors = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

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

            await delay(DELAY_BETWEEN_USERS_MS);
          }

          return { synced: batchSynced, errors: batchErrors };
        }
      );

      synced += batchResult.synced;
      errors += batchResult.errors;

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
