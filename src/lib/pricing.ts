import { Polar } from "@polar-sh/sdk";

// Pricing mode: "ltd" (lifetime deal) or "subscription"
export type PricingMode = "ltd" | "subscription";

export const pricingMode: PricingMode =
  (process.env.NEXT_PUBLIC_PRICING_MODE as PricingMode) || "subscription";

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
  price: string; // From Polar API
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

// ----- FETCH PRICES FROM POLAR -----

function formatPrice(amountInCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amountInCents / 100);
}

// Cache for server-side price fetching (revalidates every hour)
let priceCache: { prices: Map<string, number>; fetchedAt: number } | null =
  null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchPolarPrices(): Promise<Map<string, number>> {
  // Return cached if fresh
  if (priceCache && Date.now() - priceCache.fetchedAt < CACHE_TTL) {
    return priceCache.prices;
  }

  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  });

  const productIds = getPolarProducts().map((p) => p.productId);
  const prices = new Map<string, number>();

  try {
    const { result } = await polar.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID!,
      id: productIds,
    });

    for (const product of result.items) {
      const slug = getPolarProducts().find(
        (p) => p.productId === product.id
      )?.slug;
      if (slug && product.prices?.[0]) {
        const price = product.prices[0];
        // Handle different price types - priceAmount exists on fixed prices
        if ("priceAmount" in price && typeof price.priceAmount === "number") {
          prices.set(slug, price.priceAmount);
        }
      }
    }

    priceCache = { prices, fetchedAt: Date.now() };
  } catch (error) {
    console.error("Failed to fetch Polar prices:", error);
    // Return fallback prices if API fails
    prices.set("pro-ltd", 19900); // $199
    prices.set("pro-monthly", 1900); // $19
    prices.set("pro-annual", 19000); // $190
  }

  return prices;
}

// ----- MAIN FUNCTION: Get pricing plans with live prices -----

export async function getPricingPlans(): Promise<PlanDisplay[]> {
  const prices = await fetchPolarPrices();

  const freePlan: PlanDisplay = {
    ...freePlanMarketing,
    price: "$0",
    href: "/login",
  };

  const products = getPolarProducts();
  const paidPlans: PlanDisplay[] = products.map((product) => {
    const marketing = planMarketing[product.slug];
    const priceAmount = prices.get(product.slug) || 0;

    // Calculate "original price" for annual (show monthly × 12)
    let originalPrice: string | undefined;
    if (product.slug === "pro-annual") {
      const monthlyPrice = prices.get("pro-monthly") || 1900;
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
