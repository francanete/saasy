import type { Metadata } from "next";
import { getPricingPlans } from "@/lib/pricing";
import { PricingCards } from "./pricing-cards";

export const metadata: Metadata = {
  title: "Pricing | Pilotes",
  description: "Simple, transparent pricing for teams of all sizes",
};

// Revalidate prices every hour (matches cache TTL)
export const revalidate = 3600;

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const plans = await getPricingPlans();
  const params = await searchParams;
  const showSubscriptionMessage = params.reason === "no_subscription";

  return (
    <div className="py-24">
      <div className="container">
        {showSubscriptionMessage && (
          <div className="mb-8 mx-auto max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-950">
            <p className="text-amber-800 dark:text-amber-200">
              Start your free trial to access the dashboard. All plans include a
              14-day trial period.
            </p>
          </div>
        )}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day
            free trial.
          </p>
        </div>

        <PricingCards plans={plans} />
      </div>
    </div>
  );
}
