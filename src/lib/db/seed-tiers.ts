import { db } from "./index";
import { tierConfigs, featureRateLimits } from "./schema";

const tiers = [
  {
    plan: "FREE" as const,
    displayName: "Free",
    description: "Basic access with limited usage",
    sortOrder: 0,
  },
  {
    plan: "STARTER" as const,
    displayName: "Starter",
    description: "For individuals getting started",
    sortOrder: 1,
  },
  {
    plan: "GROWTH" as const,
    displayName: "Growth",
    description: "For growing teams",
    sortOrder: 2,
  },
  {
    plan: "SCALE" as const,
    displayName: "Scale",
    description: "For high-volume usage",
    sortOrder: 3,
  },
];

// Single AI limit per plan (daily requests)
const rateLimits = [
  { plan: "FREE" as const, feature: "ai", requestsPerDay: 50 },
  { plan: "STARTER" as const, feature: "ai", requestsPerDay: 250 },
  { plan: "GROWTH" as const, feature: "ai", requestsPerDay: 1000 },
  { plan: "SCALE" as const, feature: "ai", requestsPerDay: null }, // unlimited
];

export async function seedTiers() {
  console.log("Seeding tier configs...");

  // Upsert tier configs
  for (const tier of tiers) {
    await db
      .insert(tierConfigs)
      .values(tier)
      .onConflictDoUpdate({
        target: tierConfigs.plan,
        set: {
          displayName: tier.displayName,
          description: tier.description,
          sortOrder: tier.sortOrder,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`Seeded ${tiers.length} tier configs`);

  // Upsert feature rate limits
  for (const limit of rateLimits) {
    await db
      .insert(featureRateLimits)
      .values(limit)
      .onConflictDoUpdate({
        target: [featureRateLimits.plan, featureRateLimits.feature],
        set: {
          requestsPerDay: limit.requestsPerDay,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`Seeded ${rateLimits.length} feature rate limits`);

  console.log("Done seeding!");
}

// Run if executed directly
if (require.main === module) {
  seedTiers()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
