import "server-only";

import { eq } from "drizzle-orm";
import {
  db,
  invitations,
  members,
  subscriptions,
  type Subscription,
} from "@/lib/db";
import type { OrganizationContext } from "@/lib/organization";
import { polarClient } from "@/lib/polar-client";

export function hasLocalBilling(
  subscription: Subscription | undefined
): boolean {
  return Boolean(
    subscription &&
    (subscription.billingType !== "none" ||
      subscription.polarCustomerId ||
      subscription.polarSubscriptionId ||
      subscription.polarOrderId ||
      subscription.polarProductId)
  );
}

export function getRecoveryBlockReasonFromState({
  role,
  userId,
  memberUserIds,
  invitationCount,
  subscription,
}: {
  role: OrganizationContext["role"];
  userId: string;
  memberUserIds: string[];
  invitationCount: number;
  subscription: Subscription | undefined;
}): string | null {
  if (role !== "owner") {
    return "Only the owner of an empty organization can switch organizations.";
  }
  if (memberUserIds.length !== 1 || memberUserIds[0] !== userId) {
    return "This organization has other members and cannot be switched automatically.";
  }
  if (invitationCount) {
    return "This organization has invitations and cannot be switched automatically.";
  }
  if (hasLocalBilling(subscription)) {
    return "This organization has billing and cannot be switched automatically.";
  }
  return null;
}

export async function getRecoveryBlockReason(
  organization: OrganizationContext,
  userId: string
): Promise<string | null> {
  const [memberRows, invitationRows, subscriptionRows] = await Promise.all([
    db
      .select({ userId: members.userId })
      .from(members)
      .where(eq(members.organizationId, organization.id))
      .limit(2),
    db
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.organizationId, organization.id))
      .limit(1),
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organization.id))
      .limit(1),
  ]);

  return getRecoveryBlockReasonFromState({
    role: organization.role,
    userId,
    memberUserIds: memberRows.map((member) => member.userId),
    invitationCount: invitationRows.length,
    subscription: subscriptionRows[0],
  });
}

export async function getPolarRecoveryBlockReason(
  email: string
): Promise<string | null> {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return "Billing cannot be verified right now. Try again when Polar is configured.";
  }

  try {
    const [customers, openCheckouts] = await Promise.all([
      polarClient.customers.list({ email, limit: 100 }),
      polarClient.checkouts.list({
        query: email,
        status: ["open", "confirmed", "succeeded"],
        limit: 100,
      }),
    ]);
    if (
      customers.result.pagination.maxPage > 1 ||
      openCheckouts.result.pagination.maxPage > 1
    ) {
      return "Billing history needs manual review before switching organizations.";
    }
    if (
      openCheckouts.result.items.some(
        (checkout) =>
          checkout.customerEmail?.toLowerCase() === email.toLowerCase()
      )
    ) {
      return "A Polar purchase or checkout exists, so this organization needs manual review.";
    }

    for (const customer of customers.result.items) {
      const [subscriptionsPage, ordersPage, checkoutsPage] = await Promise.all([
        polarClient.subscriptions.list({ customerId: customer.id, limit: 1 }),
        polarClient.orders.list({ customerId: customer.id, limit: 1 }),
        polarClient.checkouts.list({
          customerId: customer.id,
          status: ["open", "confirmed", "succeeded"],
          limit: 1,
        }),
      ]);
      if (
        subscriptionsPage.result.items.length ||
        ordersPage.result.items.length ||
        checkoutsPage.result.items.length
      ) {
        return "A Polar purchase or checkout exists, so this organization needs manual review.";
      }
    }
    return null;
  } catch {
    return "Billing could not be verified with Polar. No organization was changed.";
  }
}
