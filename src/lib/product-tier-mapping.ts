import type { Plan } from "./db/schema";

/**
 * Map Polar product IDs to app tiers.
 * Update these when you create products in Polar.
 *
 * To find your product IDs:
 * 1. Go to Polar dashboard > Products
 * 2. Click on a product
 * 3. Copy the product ID from the URL or details
 */
export const POLAR_PRODUCT_TO_TIER: Record<string, Plan> = {
  // Monthly subscriptions
  // "prod_starter_monthly": "STARTER",
  // "prod_growth_monthly": "GROWTH",
  // "prod_scale_monthly": "SCALE",
  // Annual subscriptions
  // "prod_starter_annual": "STARTER",
  // "prod_growth_annual": "GROWTH",
  // "prod_scale_annual": "SCALE",
  // Lifetime deals
  // "prod_starter_ltd": "STARTER",
  // "prod_growth_ltd": "GROWTH",
};

/**
 * Get the app tier for a Polar product ID.
 * Defaults to FREE if product ID is not mapped.
 */
export function getPlanFromPolarProduct(
  polarProductId: string | null | undefined
): Plan {
  if (!polarProductId) return "FREE";
  return POLAR_PRODUCT_TO_TIER[polarProductId] ?? "FREE";
}
