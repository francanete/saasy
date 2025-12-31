import { inngest } from "./client";
import { db, users, subscriptions } from "@/lib/db";
import { eq, and, lt, inArray, gte, isNull } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/email";
import {
  syncSubscriptionFromPolar,
  recoverPolarCustomerId,
} from "@/lib/subscription";

// Welcome email after signup
export const welcomeEmailJob = inngest.createFunction(
  { id: "send-welcome-email" },
  { event: "user/created" },
  async ({ event }) => {
    const { userId, email } = event.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await sendWelcomeEmail(email, user?.name || "there");

    return { sent: true };
  },
);

// Daily sync of all subscriptions with Polar
export const syncAllSubscriptions = inngest.createFunction(
  { id: "sync-all-subscriptions" },
  { cron: "0 3 * * *" }, // Every day at 3 AM
  async () => {
    // Find subscriptions that haven't been synced in the last 24 hours
    const staleSubscriptions = await db
      .select({
        userId: subscriptions.userId,
        polarCustomerId: subscriptions.polarCustomerId,
      })
      .from(subscriptions)
      .where(
        and(
          lt(
            subscriptions.lastSyncedAt,
            new Date(Date.now() - 24 * 60 * 60 * 1000),
          ),
          inArray(subscriptions.status, ["ACTIVE", "TRIALING"]),
        ),
      );

    let synced = 0;
    let recovered = 0;

    for (const sub of staleSubscriptions) {
      let polarCustomerId = sub.polarCustomerId;

      // Try to recover missing polarCustomerId from Polar
      if (!polarCustomerId) {
        polarCustomerId = await recoverPolarCustomerId(sub.userId);
        if (polarCustomerId) recovered++;
      }

      // Skip if still no polarCustomerId (user never purchased on Polar)
      if (!polarCustomerId) continue;

      try {
        await syncSubscriptionFromPolar(sub.userId, polarCustomerId);
        synced++;
      } catch (error) {
        console.error(
          `Failed to sync subscription for user ${sub.userId}:`,
          error,
        );
      }

      // Rate limit: wait 100ms between API calls
      await new Promise((r) => setTimeout(r, 100));
    }

    return { synced, recovered };
  },
);

// Retry failed webhooks - check for users who signed up but have no subscription record
export const retryFailedWebhooks = inngest.createFunction(
  { id: "retry-failed-webhooks" },
  { cron: "*/15 * * * *" }, // Every 15 minutes
  async () => {
    // Find users created in the last hour without a subscription record
    const recentUsersWithoutSub = await db
      .select({ id: users.id })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(
        and(
          gte(users.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
          isNull(subscriptions.id),
        ),
      );

    let recovered = 0;

    for (const user of recentUsersWithoutSub) {
      // Create a free subscription for users without one
      try {
        await db.insert(subscriptions).values({
          userId: user.id,
          status: "ACTIVE",
        });
        recovered++;
      } catch (error) {
        // Subscription might already exist due to race condition
        console.error(
          `Failed to create subscription for user ${user.id}:`,
          error,
        );
      }
    }

    return { checked: recentUsersWithoutSub.length, recovered };
  },
);

export const functions = [
  welcomeEmailJob,
  syncAllSubscriptions,
  retryFailedWebhooks,
];
