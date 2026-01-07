import type { Metadata } from "next";
import { getTierPricing, pricingMode } from "@/lib/pricing";
import { PricingCards } from "./pricing-cards";

export const metadata: Metadata = {
  title: "Pricing | Saasy",
  description: "Simple, transparent pricing for teams of all sizes",
};

// Revalidate prices every hour (matches cache TTL)
export const revalidate = 3600;

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const tiers = getTierPricing();
  const params = await searchParams;
  const showSubscriptionMessage = params.reason === "no_subscription";

  return (
    <div className="py-12 sm:py-24">
      <div className="container">
        {showSubscriptionMessage && (
          <div className="mx-auto mb-8 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-950">
            <p className="text-amber-800 dark:text-amber-200">
              Choose a plan to access the dashboard.
            </p>
          </div>
        )}

        <PricingCards tiers={tiers} mode={pricingMode} />
      </div>
    </div>
  );
}
