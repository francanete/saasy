import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/dal";
import { hasPaidAccess } from "@/lib/subscription";
import { PricingSection } from "@/components/pricing/pricing-section";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Choose a Plan | ${appConfig.name}`,
  description: "Choose a plan to access your dashboard",
};

const REQUIRE_PAID_ACCESS = !appConfig.pricing.allowFreePlan;

export default async function GatePage() {
  // If paid access not required, redirect to dashboard
  if (!REQUIRE_PAID_ACCESS) {
    redirect("/dashboard");
  }

  const session = await getCurrentSession();

  // Require authentication
  if (!session?.user) {
    redirect("/login?redirect=/gate");
  }

  // If already paid, send to dashboard
  const isPaid = await hasPaidAccess(session.user.id);
  if (isPaid) {
    redirect("/dashboard");
  }

  return <PricingSection />;
}
