import { getCurrentSession } from "@/lib/dal";
import { getOrganizationSubscriptionStatus } from "@/lib/subscription";
import { getOrganizationForUser } from "@/lib/organization";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const organization = await getOrganizationForUser(session.user.id);
  if (!organization) {
    return NextResponse.json(
      { error: "Organization membership required", code: "NO_ORGANIZATION" },
      { status: 403 }
    );
  }
  const subscription = await getOrganizationSubscriptionStatus(organization.id);

  return NextResponse.json({
    plan: subscription.plan,
    hasAccess: subscription.hasAccess,
    status: subscription.status,
    billingType: subscription.billingType,
    expiresAt: subscription.expiresAt,
  });
}
