import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession, getSubscriptionFromRequest } from "@/lib/dal";
import { getSubscriptionStatus } from "@/lib/subscription";
import { PricingSection } from "@/components/pricing/pricing-section";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Choose a Plan | ${appConfig.name}`,
  description: "Choose a plan to access your dashboard",
};

const REQUIRE_PAID_ACCESS = appConfig.pricing.requirePaidAccess;

export default async function GatePage() {
  // proxy.ts handles most redirects, these are minimal fallbacks

  // If paid access not required, redirect to dashboard
  if (!REQUIRE_PAID_ACCESS) {
    redirect("/dashboard");
  }

  const session = await getCurrentSession();

  // Require authentication (proxy.ts should have redirected, but fallback)
  if (!session?.user) {
    redirect("/login?redirect=/gate");
  }

  // Check subscription from proxy-injected header (no DB query)
  // Falls back to DB query if header is missing
  let subscription = await getSubscriptionFromRequest();
  if (!subscription) {
    subscription = await getSubscriptionStatus(session.user.id);
  }

  // Paid user shouldn't see gate (proxy.ts should have redirected, but fallback)
  // Uses hasAccess (same as proxy + dashboard layout) to stay consistent
  if (subscription.hasAccess) {
    redirect("/dashboard");
  }

  const nativeTrialEndsAt = subscription.nativeTrialEndsAt
    ? new Date(subscription.nativeTrialEndsAt)
    : null;
  const hasExpiredNativeTrial = Boolean(
    subscription.nativeTrialStartedAt &&
    nativeTrialEndsAt &&
    !subscription.isNativeTrialActive &&
    nativeTrialEndsAt <= new Date()
  );

  return (
    <>
      {hasExpiredNativeTrial && nativeTrialEndsAt && (
        <div className="mx-auto max-w-3xl px-4 pt-12 text-center">
          <h1 className="text-3xl font-bold">Your free trial has ended</h1>
          <p className="text-muted-foreground mt-3">
            Your trial ended on{" "}
            {nativeTrialEndsAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            . Choose a plan to continue using your dashboard.
          </p>
        </div>
      )}
      <PricingSection />
    </>
  );
}
