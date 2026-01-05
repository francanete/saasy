import type { Plan } from "./db/schema";

export const appConfig = {
  name: "Saasy",
  email: {
    from: "noreply@simplesubscriber.com",
  },
  pricing: {
    mode: "subscription" as const, // "subscription" | "ltd"
    /** Prices in cents per tier and billing cycle */
    plans: {
      STARTER: { ltd: 0, monthly: 0, annual: 0 },
      GROWTH: { ltd: 0, monthly: 0, annual: 0 },
      SCALE: { ltd: 0, monthly: 0, annual: 0 },
    },
  },
  plans: {
    hierarchy: {
      FREE: 0,
      STARTER: 1,
      GROWTH: 2,
      SCALE: 3,
    } as const satisfies Record<Plan, number>,
  },
  polar: {
    /**
     * Map Polar product IDs to app tiers.
     * Update these when you create products in Polar.
     *
     * To find your product IDs:
     * 1. Go to Polar dashboard > Products
     * 2. Click on a product
     * 3. Copy the product ID from the URL or details
     */
    productToTier: {
      /* 🗓️ Monthly subscriptions */
      "64e937b4-4da7-4c09-9bd3-f38f440799e1": "STARTER",
      // "prod_growth_monthly": "GROWTH",
      // "prod_scale_monthly": "SCALE",
      /* 🗓️ Annual subscriptions */
      // "prod_starter_annual": "STARTER",
      // "prod_growth_annual": "GROWTH",
      // "prod_scale_annual": "SCALE",
      /* 💸 Lifetime deals */
      // "prod_starter_ltd": "STARTER",
      // "prod_growth_ltd": "GROWTH",
    } as Record<string, Plan>,
  },
} as const;

/**
 * Get the app tier for a Polar product ID.
 * Defaults to FREE if product ID is not mapped.
 */
export function getPlanFromPolarProduct(
  polarProductId: string | null | undefined
): Plan {
  if (!polarProductId) return "FREE";
  return appConfig.polar.productToTier[polarProductId] ?? "FREE";
}
