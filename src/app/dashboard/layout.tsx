import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { TrialBanner } from "@/components/trial-banner";
import { Sidebar } from "@/components/layouts/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Get subscription status
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  // For now, allow access even without subscription (FREE tier)
  // Uncomment below to require subscription:
  // const hasAccess = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
  // if (!hasAccess) {
  //   redirect("/pricing?reason=no_subscription");
  // }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} plan={subscription?.plan || "FREE"} />
      <div className="flex-1">
        {subscription?.status === "TRIALING" && subscription.currentPeriodEnd && (
          <TrialBanner endsAt={subscription.currentPeriodEnd} />
        )}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
