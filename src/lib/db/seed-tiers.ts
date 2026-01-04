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

const rateLimits = [
  // FREE tier
  {
    plan: "FREE" as const,
    feature: "chat",
    requestsPerHour: 10,
    requestsPerDay: 50,
  },
  {
    plan: "FREE" as const,
    feature: "generation",
    requestsPerHour: 5,
    requestsPerDay: 25,
  },

  // STARTER tier
  {
    plan: "STARTER" as const,
    feature: "chat",
    requestsPerHour: 50,
    requestsPerDay: 250,
  },
  {
    plan: "STARTER" as const,
    feature: "generation",
    requestsPerHour: 25,
    requestsPerDay: 125,
  },

  // GROWTH tier
  {
    plan: "GROWTH" as const,
    feature: "chat",
    requestsPerHour: 200,
    requestsPerDay: 1000,
  },
  {
    plan: "GROWTH" as const,
    feature: "generation",
    requestsPerHour: 100,
    requestsPerDay: 500,
  },

  // SCALE tier (null = unlimited daily)
  {
    plan: "SCALE" as const,
    feature: "chat",
    requestsPerHour: 1000,
    requestsPerDay: null,
  },
  {
    plan: "SCALE" as const,
    feature: "generation",
    requestsPerHour: 500,
    requestsPerDay: null,
  },
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
          requestsPerHour: limit.requestsPerHour,
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
