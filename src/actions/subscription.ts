"use server";

import { getCurrentSession } from "@/lib/dal";
import {
  syncWithPolar,
  syncWithCustomerToken,
  hasPaidAccess,
} from "@/lib/subscription";

export type SyncSubscriptionResult = {
  success: boolean;
  canAccessDashboard: boolean;
  error?: string;
};

/**
 * Sync subscription from Polar API and check paid access.
 * With a customer session token, uses the fast Customer Portal API path.
 * Falls back to Admin API (syncWithPolar) with retry logic.
 */
export async function syncSubscriptionAction(
  customerSessionToken?: string
): Promise<SyncSubscriptionResult> {
  const session = await getCurrentSession();

  if (!session?.user) {
    return {
      success: false,
      canAccessDashboard: false,
      error: "Not authenticated",
    };
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // Fast path: use Customer Portal API with session token
  if (customerSessionToken) {
    try {
      await syncWithCustomerToken(userId, userEmail, customerSessionToken);
      const canAccess = await hasPaidAccess(userId);
      return { success: true, canAccessDashboard: canAccess };
    } catch (error) {
      console.error("Customer token sync failed, falling back to admin API:", error);
      // Fall through to retry path
    }
  }

  // Slow path with retries: Admin API may have eventual consistency delay
  // TODO(human): implement syncWithRetries
  try {
    await syncWithRetries(userId);
    const canAccess = await hasPaidAccess(userId);
    return { success: true, canAccessDashboard: canAccess };
  } catch {
    // Check if they have access anyway (webhook might have arrived)
    const canAccess = await hasPaidAccess(userId);
    return {
      success: false,
      canAccessDashboard: canAccess,
      error: "Sync failed after retries",
    };
  }
}

/**
 * TODO(human): Implement retry logic for syncWithPolar.
 *
 * Retry syncWithPolar up to maxAttempts times with exponential backoff.
 * After each attempt, check hasPaidAccess — if already true (e.g. webhook
 * arrived), return early without exhausting all retries.
 *
 * Suggested delays: 1.5s, 2.5s, 4s, 6s, 8s (or use a formula).
 * Throw the last error if all attempts fail.
 */
async function syncWithRetries(userId: string): Promise<void> {
  // Replace this with retry logic
  await syncWithPolar(userId);
}
