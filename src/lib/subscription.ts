import { Polar } from "@polar-sh/sdk";
import { db, subscriptions } from "./db";
import { eq } from "drizzle-orm";

// How often to re-verify with Polar API (1 hour)
const SYNC_INTERVAL_MS = 60 * 60 * 1000;

export type BillingType = "recurring" | "one_time";
export type SubscriptionStatusType =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "TRIALING";

export type SubscriptionStatus = {
  hasAccess: boolean;
  status: SubscriptionStatusType | "NONE";
  billingType: BillingType | null;
  isLifetime: boolean;
  polarProductId: string | null;
  expiresAt: Date | null;
};

// ============ Webhook Helpers ============

export type UpsertSubscriptionData = {
  userId: string;
  polarCustomerId: string;
  polarSubscriptionId?: string;
  polarOrderId?: string;
  polarProductId: string;
  billingType: BillingType;
  status: SubscriptionStatusType;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
};

export async function upsertSubscription(
  data: UpsertSubscriptionData
): Promise<void> {
  await db
    .insert(subscriptions)
    .values({
      userId: data.userId,
      polarCustomerId: data.polarCustomerId,
      polarSubscriptionId: data.polarSubscriptionId,
      polarOrderId: data.polarOrderId,
      polarProductId: data.polarProductId,
      billingType: data.billingType,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      plan: "PRO", // Default to PRO for any paid product
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        polarCustomerId: data.polarCustomerId,
        polarSubscriptionId: data.polarSubscriptionId,
        polarOrderId: data.polarOrderId,
        polarProductId: data.polarProductId,
        billingType: data.billingType,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        plan: "PRO",
        updatedAt: new Date(),
      },
    });
}

export type UpdateSubscriptionData = {
  polarSubscriptionId: string;
  status: SubscriptionStatusType;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
};

export async function updateSubscriptionStatus(
  data: UpdateSubscriptionData
): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.polarSubscriptionId, data.polarSubscriptionId));
}

// Map Polar status strings to our enum
export function mapPolarStatus(polarStatus: string): SubscriptionStatusType {
  switch (polarStatus.toLowerCase()) {
    case "active":
      return "ACTIVE";
    case "canceled":
    case "cancelled":
      return "CANCELED";
    case "past_due":
      return "PAST_DUE";
    case "trialing":
      return "TRIALING";
    default:
      return "ACTIVE";
  }
}

// ============ API Sync (Fallback for missed webhooks) ============

/**
 * Recover missing polarCustomerId by looking up the customer in Polar by externalId.
 * This handles cases where the webhook failed to store the customer ID.
 */
export async function recoverPolarCustomerId(
  userId: string
): Promise<string | null> {
  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  });

  try {
    const customer = await polar.customers.getExternal({
      externalId: userId,
    });

    // Store the recovered polarCustomerId
    await db
      .update(subscriptions)
      .set({ polarCustomerId: customer.id })
      .where(eq(subscriptions.userId, userId));

    console.log(`Recovered polarCustomerId for user ${userId}: ${customer.id}`);
    return customer.id;
  } catch (error) {
    console.error("Failed to recover polarCustomerId:", error);
    return null;
  }
}

/**
 * Sync subscription from Polar API.
 * Called when local DB shows no access but user is a Polar customer.
 * This handles cases where webhooks may have failed.
 */
export async function syncSubscriptionFromPolar(
  userId: string,
  polarCustomerId: string
): Promise<SubscriptionStatus> {
  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  });

  try {
    // Check for active subscriptions first
    const { result: subResult } = await polar.subscriptions.list({
      customerId: polarCustomerId,
      active: true,
    });

    if (subResult.items.length > 0) {
      const sub = subResult.items[0];
      const product = sub.product;

      if (product) {
        await upsertSubscription({
          userId,
          polarCustomerId,
          polarSubscriptionId: sub.id,
          polarProductId: product.id,
          billingType: "recurring",
          status: mapPolarStatus(sub.status),
          currentPeriodEnd: sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd)
            : undefined,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        });

        // Update lastSyncedAt
        await db
          .update(subscriptions)
          .set({ lastSyncedAt: new Date() })
          .where(eq(subscriptions.userId, userId));

        const hasAccess = sub.status === "active" || sub.status === "trialing";
        return {
          hasAccess,
          status: mapPolarStatus(sub.status),
          billingType: "recurring",
          isLifetime: false,
          polarProductId: product.id,
          expiresAt: sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd)
            : null,
        };
      }
    }

    // Check for one-time purchases (LTD)
    const { result: orderResult } = await polar.orders.list({
      customerId: polarCustomerId,
    });

    const paidOrder = orderResult.items.find((o) => o.paid);
    if (paidOrder && paidOrder.product) {
      await upsertSubscription({
        userId,
        polarCustomerId,
        polarOrderId: paidOrder.id,
        polarProductId: paidOrder.product.id,
        billingType: "one_time",
        status: "ACTIVE",
      });

      await db
        .update(subscriptions)
        .set({ lastSyncedAt: new Date() })
        .where(eq(subscriptions.userId, userId));

      return {
        hasAccess: true,
        status: "ACTIVE",
        billingType: "one_time",
        isLifetime: true,
        polarProductId: paidOrder.product.id,
        expiresAt: null,
      };
    }

    // No active subscription or order found - still update lastSyncedAt
    await db
      .update(subscriptions)
      .set({ lastSyncedAt: new Date() })
      .where(eq(subscriptions.userId, userId));

    return {
      hasAccess: false,
      status: "NONE",
      billingType: null,
      isLifetime: false,
      polarProductId: null,
      expiresAt: null,
    };
  } catch (error) {
    console.error("Failed to sync subscription from Polar:", error);
    // On error, return no-access but don't update lastSyncedAt
    // This allows retry on next access check
    return {
      hasAccess: false,
      status: "NONE",
      billingType: null,
      isLifetime: false,
      polarProductId: null,
      expiresAt: null,
    };
  }
}

// ============ Access Control ============

/**
 * Get subscription status with smart fallback.
 * - If user has access: trust local DB (webhooks keep it updated)
 * - If user has NO access but is a Polar customer: verify with API (max 1/hour)
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!subscription) {
    return {
      hasAccess: false,
      status: "NONE",
      billingType: null,
      isLifetime: false,
      polarProductId: null,
      expiresAt: null,
    };
  }

  const hasAccess =
    subscription.status === "ACTIVE" || subscription.status === "TRIALING";

  // SMART FALLBACK: If no access but user is a Polar customer, verify with API
  if (!hasAccess && subscription.polarCustomerId) {
    const needsSync =
      !subscription.lastSyncedAt ||
      Date.now() - subscription.lastSyncedAt.getTime() > SYNC_INTERVAL_MS;

    if (needsSync) {
      console.log(`Syncing subscription for user ${userId} from Polar API`);
      return syncSubscriptionFromPolar(userId, subscription.polarCustomerId);
    }
  }

  // Trust local DB
  const isLifetime = subscription.billingType === "one_time";

  return {
    hasAccess,
    status: subscription.status as SubscriptionStatusType,
    billingType: subscription.billingType as BillingType | null,
    isLifetime,
    polarProductId: subscription.polarProductId,
    expiresAt: subscription.currentPeriodEnd,
  };
}
