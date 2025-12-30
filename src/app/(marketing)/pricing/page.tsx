import type { Metadata } from "next";
import { getPricingPlans } from "@/lib/pricing";
import { PricingCards } from "./pricing-cards";

export const metadata: Metadata = {
  title: "Pricing | Pilotes",
  description: "Simple, transparent pricing for teams of all sizes",
};

// Revalidate prices every hour (matches cache TTL)
export const revalidate = 3600;

export default async function PricingPage() {
  // Fetch prices from Polar on the server
  const plans = await getPricingPlans();

  return (
    <div className="py-24">
      <div className="container">
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
