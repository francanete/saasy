import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/dal";
import { hasPaidAccess } from "@/lib/subscription";
import { GateContent } from "@/components/gate-content";
import { getPricingPlans } from "@/lib/pricing";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Choose a Plan | ${appConfig.name}`,
  description: "Choose a plan to access your dashboard",
};

const REQUIRE_PAID_ACCESS =
  process.env.NEXT_PUBLIC_REQUIRE_PAID_ACCESS === "true";

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

  // Get pricing plans (excluding free plan for gate page)
  const allPlans = await getPricingPlans();
  const paidPlans = allPlans.filter((plan) => plan.slug); // Only plans with checkout slug

  return (
    <GateContent
      email={session.user.email}
      userId={session.user.id}
      userName={session.user.name}
      plans={paidPlans}
    />
  );
}
