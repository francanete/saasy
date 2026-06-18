import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { onboardingFlows } from "@/lib/db/schema";
import { getSubscriptionStatus } from "@/lib/subscription";
import { getSubscriptionFromRequest, isUserAdmin } from "@/lib/dal";
import { appConfig } from "@/lib/config";
import { IdentifyUser } from "@/components/analytics/identify-user";
import { TrialBanner } from "@/components/trial-banner";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { CheckoutSuccessToast } from "@/components/checkout-success-toast";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const REQUIRE_PAID_ACCESS = appConfig.pricing.requirePaidAccess;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session check (uses Better Auth's 5-min cookie cache)
  // proxy.ts handles redirects, this is a fallback
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Read subscription from proxy-injected header (no DB query)
  // Falls back to DB query if header is missing
  let subscription = await getSubscriptionFromRequest();
  if (!subscription) {
    subscription = await getSubscriptionStatus(session.user.id);
  }

  // Fallback: If paid access required and user has no access, redirect to gate
  // Uses hasAccess (same as proxy) to avoid redirect loop
  if (REQUIRE_PAID_ACCESS && !subscription.hasAccess) {
    redirect("/gate");
  }

  // Get admin status and onboarding flow status
  const [isAdmin, dashboardOnboarding] = await Promise.all([
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

  // Read sidebar state from cookie (written by useDashboardSettings)
  const cookieStore = await cookies();
  const settingsRaw = cookieStore.get("dashboardSettings")?.value;
  let sidebarOpen = true;
  if (settingsRaw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(settingsRaw));
      sidebarOpen = parsed.sidebarOpen !== false;
    } catch {
      // ignore malformed cookie
    }
  }

  return (
    <OnboardingProvider
      flowId="dashboard"
      flowCompleted={dashboardFlowCompleted}
    >
      <IdentifyUser />
      <SidebarProvider defaultOpen={sidebarOpen}>
        <Suspense fallback={null}>
          <CheckoutSuccessToast />
        </Suspense>
        <AppSidebar
          user={session.user}
          plan={subscription.plan}
          subscriptionStatus={subscription.status}
          expiresAt={
            subscription.isNativeTrialActive
              ? subscription.nativeTrialEndsAt
              : subscription.expiresAt
          }
          isNativeTrialActive={subscription.isNativeTrialActive}
          isAdmin={isAdmin}
        />
        <SidebarInset>
          <header className="flex h-12 items-center gap-3 px-4 md:hidden">
            <SidebarTrigger />
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
              <span className="text-xs font-bold">
                {appConfig.name.charAt(0)}
              </span>
            </div>
            <span className="text-sm font-semibold">{appConfig.name}</span>
          </header>
          {subscription.isNativeTrialActive &&
            subscription.nativeTrialEndsAt && (
              <TrialBanner endsAt={subscription.nativeTrialEndsAt} />
            )}
          <main className="flex min-h-0 flex-1 flex-col p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </OnboardingProvider>
  );
}
