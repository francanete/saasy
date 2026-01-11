import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { onboardingFlows } from "@/lib/db/schema";
import { getSubscriptionStatus } from "@/lib/subscription";
import { isUserAdmin } from "@/lib/dal";
import { appConfig } from "@/lib/config";
import { TrialBanner } from "@/components/trial-banner";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { CheckoutSuccessToast } from "@/components/checkout-success-toast";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const REQUIRE_PAID_ACCESS = !appConfig.pricing.allowFreePlan;

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

  // Get subscription status, admin status, and onboarding flow status
  const [subscription, isAdmin, dashboardOnboarding] = await Promise.all([
    getSubscriptionStatus(session.user.id),
    isUserAdmin(session.user.id),
    db.query.onboardingFlows.findFirst({
      where: and(
        eq(onboardingFlows.userId, session.user.id),
        eq(onboardingFlows.flowId, "dashboard")
      ),
    }),
  ]);

  // Flow is completed if completedAt or skippedAt is set
  const dashboardFlowCompleted = !!(
    dashboardOnboarding?.completedAt || dashboardOnboarding?.skippedAt
  );

  // If paid access required and user is on FREE plan, redirect to gate
  if (REQUIRE_PAID_ACCESS && subscription.plan === "FREE") {
    redirect("/gate");
  }

  return (
    <OnboardingProvider
      flowId="dashboard"
      flowCompleted={dashboardFlowCompleted}
    >
      <SidebarProvider>
        <Suspense fallback={null}>
          <CheckoutSuccessToast />
        </Suspense>
        <AppSidebar
          user={session.user}
          plan={subscription.plan}
          subscriptionStatus={subscription.status}
          expiresAt={subscription.expiresAt}
          isAdmin={isAdmin}
        />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <span className="text-muted-foreground text-sm">Dashboard</span>
          </header>
          {subscription.status === "TRIALING" && subscription.expiresAt && (
            <TrialBanner endsAt={subscription.expiresAt} />
          )}
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </OnboardingProvider>
  );
}
