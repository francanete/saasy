import { appConfig } from "./config";

export type PricingMode = "ltd" | "subscription";

export const pricingMode: PricingMode = appConfig.pricing.mode;

// Product configuration for Polar checkout
export type PolarProduct = {
  productId: string;
  slug: string;
};

// Get products based on pricing mode (for Better Auth checkout config)
export function getPolarProducts(): PolarProduct[] {
  if (pricingMode === "ltd") {
    return [
      {
        productId: process.env.POLAR_PRO_LTD_PRODUCT_ID!,
        slug: "pro-ltd",
      },
    ];
  }

  // Subscription mode
  return [
    {
      productId: process.env.POLAR_PRO_MONTHLY_PRODUCT_ID!,
      slug: "pro-monthly",
    },
    {
      productId: process.env.POLAR_PRO_ANNUAL_PRODUCT_ID!,
      slug: "pro-annual",
    },
  ];
}

// ----- MARKETING COPY (stored in config) -----

type PlanMarketing = {
  name: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
  period?: string;
};

const freePlanMarketing: PlanMarketing = {
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
};

const proFeatures = [
  "Unlimited projects",
  "Advanced analytics",
  "Priority support",
  "API access",
  "Custom integrations",
  "Team collaboration",
];

// Marketing copy keyed by product slug
const planMarketing: Record<string, PlanMarketing> = {
  "pro-ltd": {
    name: "Pro Lifetime",
    description: "Pay once, use forever",
    features: [...proFeatures, "Lifetime updates", "No recurring fees"],
    cta: "Get Lifetime Access",
    highlighted: true,
    badge: "Limited Offer",
  },
  "pro-monthly": {
    name: "Pro Monthly",
    description: "For professionals and small teams",
    features: proFeatures,
    cta: "Start Free Trial",
    highlighted: false,
    period: "/month",
  },
  "pro-annual": {
    name: "Pro Annual",
    description: "Best value - save 17%",
    features: proFeatures,
    cta: "Start Free Trial",
    highlighted: true,
    badge: "Best Value",
    period: "/year",
  },
};

// ----- PRICING DISPLAY TYPE -----

export type PlanDisplay = {
  name: string;
  price: string; // From config
  originalPrice?: string; // Calculated for annual (monthly × 12)
  period?: string;
  description: string;
  features: string[];
  cta: string;
  slug?: string;
  href?: string;
  highlighted: boolean;
  badge?: string;
};

// ----- PRICE UTILITIES -----

function formatPrice(amountInCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amountInCents / 100);
}

/** Get price from config for a given tier and billing cycle */
function getPrice(
  tier: "STARTER" | "GROWTH" | "SCALE",
  cycle: "ltd" | "monthly" | "annual"
): number {
  return appConfig.pricing.plans[tier][cycle];
}

// ----- MAIN FUNCTION: Get pricing plans from config -----

export function getPricingPlans(): PlanDisplay[] {
  const freePlan: PlanDisplay = {
    ...freePlanMarketing,
    price: "$0",
    href: "/login",
  };

  const products = getPolarProducts();
  // Map product slugs to tier/cycle for config lookup
  // Currently all "pro-*" products map to STARTER tier
  const slugToConfig: Record<string, { tier: "STARTER" | "GROWTH" | "SCALE"; cycle: "ltd" | "monthly" | "annual" }> = {
    "pro-ltd": { tier: "STARTER", cycle: "ltd" },
    "pro-monthly": { tier: "STARTER", cycle: "monthly" },
    "pro-annual": { tier: "STARTER", cycle: "annual" },
  };

  const paidPlans: PlanDisplay[] = products.map((product) => {
    const marketing = planMarketing[product.slug];
    const config = slugToConfig[product.slug];
    const priceAmount = config ? getPrice(config.tier, config.cycle) : 0;

    // Calculate "original price" for annual (show monthly × 12)
    let originalPrice: string | undefined;
    if (product.slug === "pro-annual") {
      const monthlyPrice = getPrice("STARTER", "monthly");
      originalPrice = formatPrice(monthlyPrice * 12);
    }

    return {
      ...marketing,
      price: formatPrice(priceAmount),
      originalPrice,
      slug: product.slug,
    };
  });

  return [freePlan, ...paidPlans];
}

// ----- SYNC VERSION (for client components using server-fetched data) -----

export type SerializedPricingData = {
  plans: PlanDisplay[];
  mode: PricingMode;
};
