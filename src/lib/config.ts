import type { Plan } from "./db/schema";

export type BillingCycle = "ltd" | "monthly" | "annual";
export type PaidTier = Exclude<Plan, "FREE">;

export type TierMarketing = {
  name: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
};

export type TierConfig = {
  enabled: boolean;
  /** Prices in cents */
  prices: Record<BillingCycle, number>;
  /** Original prices in cents (for strikethrough when discount active) */
  originalPrices?: Record<BillingCycle, number>;
  /** Polar product IDs - get from Polar dashboard */
  polarProductIds: Record<BillingCycle, string>;
  marketing: TierMarketing;
};

export const appConfig = {
  name: "Saasy",
  email: {
    from: "noreply@simplesubscriber.com",
  },
  pricing: {
    mode: "subscription" as const, // "subscription" | "ltd"
    allowFreePlan: false, // Show free plan on pricing page & allow FREE users in dashboard
    tiers: {
      STARTER: {
        enabled: true,
        prices: { ltd: 4900, monthly: 900, annual: 9000 },
        originalPrices: { ltd: 9900, monthly: 900, annual: 19900 },
        polarProductIds: {
          ltd: "64e937b4-4da7-4c09-9bd3-f38f440799e1",
          monthly: "64e937b4-4da7-4c09-9bd3-f38f440799e1",
          annual: "64e937b4-4da7-4c09-9bd3-f38f440799e1",
        },
        marketing: {
          name: "Starter",
          description: "For professionals and small teams",
          features: [
            "Advanced analytics",
            "Custom integrations",
            "Team collaboration",
          ],
          cta: "START FREE",
          highlighted: false,
        },
      },
      GROWTH: {
        enabled: false,
        prices: { ltd: 0, monthly: 0, annual: 0 },
        polarProductIds: {
          ltd: "",
          monthly: "",
          annual: "",
        },
        marketing: {
          name: "Growth",
          description: "For growing businesses",
          features: [
            "Everything in Starter",
            "Advanced team management",
            "Custom workflows",
            "Priority support",
            "API access",
            "Dedicated account manager",
          ],
          cta: "Start Free Trial",
          highlighted: true,
          badge: "Popular",
        },
      },
      SCALE: {
        enabled: false,
        prices: { ltd: 0, monthly: 0, annual: 0 },
        polarProductIds: { ltd: "", monthly: "", annual: "" },
        marketing: {
          name: "Scale",
          description: "For enterprises",
          features: [
            "Everything in Growth",
            "SSO & SAML",
            "Custom SLAs",
            "Dedicated support",
            "On-premise deployment",
            "Custom contracts",
          ],
          cta: "Contact Sales",
          highlighted: false,
        },
      },
    } satisfies Record<PaidTier, TierConfig>,

    freeMarketing: {
      name: "Free",
      description: "For individuals getting started",
      features: [
        "Up to 3 projects",
        "Basic analytics",
        "Community support",
        "API access",
      ],
      cta: "Get Started",
      highlighted: false,
    } satisfies TierMarketing,

    /** Extra features for LTD plans (appended to tier features) */
    ltdExtraFeatures: ["Lifetime updates", "No recurring fees"],
  },
  plans: {
    hierarchy: {
      FREE: 0,
      STARTER: 1,
      GROWTH: 2,
      SCALE: 3,
    } as const satisfies Record<Plan, number>,
  },
} as const;

/**
 * Build product-to-tier mapping from tiers config.
 * Called once and cached.
 */
function buildProductToTierMap(): Record<string, Plan> {
  const map: Record<string, Plan> = {};
  const tiers = appConfig.pricing.tiers;

  for (const [tier, config] of Object.entries(tiers)) {
    const { polarProductIds } = config;
    if (polarProductIds.ltd) map[polarProductIds.ltd] = tier as Plan;
    if (polarProductIds.monthly) map[polarProductIds.monthly] = tier as Plan;
    if (polarProductIds.annual) map[polarProductIds.annual] = tier as Plan;
  }

  return map;
}

// Cached product-to-tier map
let productToTierMap: Record<string, Plan> | null = null;

/**
 * Get the app tier for a Polar product ID.
 * Defaults to FREE if product ID is not mapped.
 */
export function getPlanFromPolarProduct(
  polarProductId: string | null | undefined
): Plan {
  if (!polarProductId) return "FREE";

  if (!productToTierMap) {
    productToTierMap = buildProductToTierMap();
  }

  const plan = productToTierMap[polarProductId];

  if (!plan) {
    console.error(
      `[CRITICAL] Unknown Polar product ID: "${polarProductId}" - defaulting to FREE. ` +
        `Check appConfig.pricing.tiers.polarProductIds. ` +
        `Known IDs: ${JSON.stringify(Object.keys(productToTierMap))}`
    );
    return "FREE";
  }

  return plan;
}
