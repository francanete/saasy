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

export type FeatureRateLimits = {
  requestsPerDay: number | null; // null = unlimited
  tokensPerDay?: number | null;
};

export type PlanRateLimits = {
  [feature: string]: FeatureRateLimits;
};

export type ResendSegments = {
  freeTrialId: string;
  paidId: string;
};

export type AppConfig = {
  name: string;
  description: string;
  email: { from: string };
  team: { name: string };
  socials: {
    twitter: string;
    twitterHandle: string;
    github: string;
    linkedin: string;
  };
  pricing: {
    mode: "subscription" | "ltd";
    requirePaidAccess: boolean;
    trialDays?: number;
    tiers: Record<PaidTier, TierConfig>;
    freeMarketing: TierMarketing;
    ltdExtraFeatures: string[];
    rateLimits: Record<Plan, PlanRateLimits>;
  };
  resendSegments: ResendSegments;
  plans: { hierarchy: Record<Plan, number> };
  legal: {
    company: {
      name: string;
      registrationNumber: string;
      registeredAddress: string;
      contactLink: string;
    };
    dataHandling: { subProcessors: string[] };
    terms: { minimumAge: number; jurisdiction: string };
    lastUpdated: string;
  };
  seo: {
    siteUrl: string;
    title: { default: string; template: string };
    description: string;
    keywords: string[];
    openGraph: { type: "website"; locale: string; siteName: string };
    twitter: { card: "summary_large_image"; site: string; creator: string };
    organization: { name: string; logo: string; sameAs: string[] };
    product: {
      name: string;
      applicationCategory: string;
      operatingSystem: string;
    };
    verification: { google: string | null };
    robots: {
      index: boolean;
      follow: boolean;
      googleBot: {
        index: boolean;
        follow: boolean;
        "max-video-preview": number;
        "max-image-preview": "large";
        "max-snippet": number;
      };
    };
  };
};

export const polarProductIdsByEnv = {
  sandbox: {
    STARTER: {
      ltd: "64e937b4-4da7-4c09-9bd3-f38f440799e1",
      monthly: "64e937b4-4da7-4c09-9bd3-f38f440799e1",
      annual: "64e937b4-4da7-4c09-9bd3-f38f440799e1",
    },
    GROWTH: { ltd: "", monthly: "", annual: "" },
    SCALE: { ltd: "", monthly: "", annual: "" },
  },
  production: {
    STARTER: { ltd: "", monthly: "", annual: "" },
    GROWTH: { ltd: "", monthly: "", annual: "" },
    SCALE: { ltd: "", monthly: "", annual: "" },
  },
} as const satisfies Record<
  string,
  Record<PaidTier, Record<BillingCycle, string>>
>;

const polarEnv = (
  process.env.POLAR_SERVER === "production" ? "production" : "sandbox"
) as keyof typeof polarProductIdsByEnv;
const polarIds = polarProductIdsByEnv[polarEnv];

export const appConfig: AppConfig = {
  name: "Saasy",
  description: "The complete platform for building modern applications.",
  email: {
    from: "noreply@simplesubscriber.com",
  },
  team: { name: "Saasy" },
  socials: {
    twitter: "https://twitter.com",
    twitterHandle: "@saasyapp",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  resendSegments: {
    freeTrialId: "",
    paidId: "",
  },
  pricing: {
    mode: "subscription" as const, // "subscription" | "ltd"
    requirePaidAccess: true, // Require paid plan to access dashboard
    trialDays: 5,
    tiers: {
      STARTER: {
        enabled: true,
        prices: { ltd: 6700, monthly: 2400, annual: 24000 },
        originalPrices: { ltd: 9900, monthly: 2400, annual: 28800 },
        polarProductIds: polarIds.STARTER,
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
        polarProductIds: polarIds.GROWTH,
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
        polarProductIds: polarIds.SCALE,
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
    rateLimits: {
      FREE: {
        chat: { requestsPerDay: 10, tokensPerDay: 10000 },
      },
      STARTER: {
        chat: { requestsPerDay: 50, tokensPerDay: 50000 },
      },
      GROWTH: {
        chat: { requestsPerDay: 200, tokensPerDay: 200000 },
      },
      SCALE: {
        chat: { requestsPerDay: 1000, tokensPerDay: 1000000 },
      },
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
  /**
   * Legal configuration - REQUIRED for UK compliance
   * Update these fields before launching
   */
  legal: {
    company: {
      name: "Emmerit Business Consulting Ltd",
      registrationNumber: "08361828",
      registeredAddress:
        "3 Hardman Square, Spinningfields, Manchester, United Kingdom, M3 3EB",
      contactLink: "https://tally.so/r/eqrMWE?ref=saasy",
    },
    dataHandling: {
      subProcessors: [
        "Neon - Database (US)",
        "Polar - Payments (EU)",
        "Resend - Email (US)",
        "Google Cloud - AI (US)",
        "Vercel - Hosting (US)",
      ],
    },
    terms: {
      minimumAge: 18,
      jurisdiction: "England and Wales",
    },
    lastUpdated: "January 2025",
  },
  seo: {
    siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com",
    title: {
      default: "Saasy - Build Your SaaS Faster",
      template: "%s | Saasy",
    },
    description:
      "A modern, production-ready SaaS boilerplate with authentication, payments, AI integration, and everything you need to launch.",
    keywords: [
      "SaaS boilerplate",
      "Next.js template",
      "React SaaS",
      "authentication",
      "payments",
      "AI integration",
    ],
    openGraph: {
      type: "website" as const,
      locale: "en_US",
      siteName: "Saasy",
    },
    twitter: {
      card: "summary_large_image" as const,
      site: "@saasyapp",
      creator: "@saasyapp",
    },
    organization: {
      name: "Saasy",
      logo: "/logo.png",
      sameAs: [
        "https://twitter.com/saasyapp",
        "https://github.com/saasyapp",
        "https://linkedin.com/company/saasyapp",
      ],
    },
    product: {
      name: "Saasy",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || null,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
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
