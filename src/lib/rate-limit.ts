import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { db } from "./db";
import { featureRateLimits } from "./db/schema";
import { eq, and } from "drizzle-orm";

const UPSTASH_PREFIX = "@upstash/ratelimit";

// Single Redis instance for all rate limiters
const redis = Redis.fromEnv();

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  limitType: "hourly" | "daily";
  pending: Promise<unknown>;
};

type FeatureLimitConfig = {
  requestsPerHour: number;
  requestsPerDay: number | null;
};

// Cache feature limits (per-request deduplication)
const featureLimitCache = new Map<
  string,
  { config: FeatureLimitConfig; expiresAt: number }
>();
const CACHE_TTL_MS = 60_000; // 1 minute

// Default fallback limits if not configured in DB
const DEFAULT_LIMITS: FeatureLimitConfig = {
  requestsPerHour: 5,
  requestsPerDay: 25,
};

/**
 * Clear the feature limit cache.
 * Call this after admin updates rate limits.
 */
export function clearFeatureLimitCache(): void {
  featureLimitCache.clear();
}

/**
 * Get rate limit config for a plan + feature combination.
 * Uses in-memory cache with 60s TTL.
 */
async function getFeatureLimit(
  plan: string,
  feature: string
): Promise<FeatureLimitConfig> {
  const cacheKey = `${plan}:${feature}`;
  const cached = featureLimitCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  try {
    const config = await db.query.featureRateLimits.findFirst({
      where: and(
        eq(
          featureRateLimits.plan,
          plan as "FREE" | "STARTER" | "GROWTH" | "SCALE"
        ),
        eq(featureRateLimits.feature, feature),
        eq(featureRateLimits.isActive, true)
      ),
    });

    const limits: FeatureLimitConfig = {
      requestsPerHour:
        config?.requestsPerHour ?? DEFAULT_LIMITS.requestsPerHour,
      requestsPerDay: config?.requestsPerDay ?? DEFAULT_LIMITS.requestsPerDay,
    };

    featureLimitCache.set(cacheKey, {
      config: limits,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return limits;
  } catch (error) {
    console.error("Failed to fetch feature limits:", error);
    // Return defaults on error
    return DEFAULT_LIMITS;
  }
}

/**
 * Generic rate limit check for any feature.
 * Checks daily limit FIRST, then hourly, to avoid race condition.
 */
export async function checkRateLimit(
  userId: string,
  plan: string,
  feature: string
): Promise<RateLimitResult> {
  try {
    const config = await getFeatureLimit(plan, feature);

    // Check daily limit FIRST to avoid consuming hourly quota
    // when daily is exhausted (fixes race condition bug)
    if (config.requestsPerDay) {
      const dailyLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.requestsPerDay, "1d"),
        prefix: UPSTASH_PREFIX,
        analytics: true,
      });

      // Include feature and window in identifier for proper namespacing
      const dailyResult = await dailyLimiter.limit(
        `${feature}:daily:${userId}`
      );
      dailyResult.pending.catch(() => {});

      if (!dailyResult.success) {
        return {
          success: false,
          remaining: dailyResult.remaining,
          resetAt: new Date(dailyResult.reset),
          limit: config.requestsPerDay,
          limitType: "daily",
          pending: dailyResult.pending,
        };
      }
    }

    // Hourly limit check (only runs if daily passed or not configured)
    const hourlyLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requestsPerHour, "1h"),
      prefix: UPSTASH_PREFIX,
      analytics: true,
    });

    // Include feature and window in identifier for proper namespacing
    const hourlyResult = await hourlyLimiter.limit(
      `${feature}:hourly:${userId}`
    );
    hourlyResult.pending.catch(() => {});

    if (!hourlyResult.success) {
      return {
        success: false,
        remaining: hourlyResult.remaining,
        resetAt: new Date(hourlyResult.reset),
        limit: config.requestsPerHour,
        limitType: "hourly",
        pending: hourlyResult.pending,
      };
    }

    return {
      success: true,
      remaining: hourlyResult.remaining,
      resetAt: new Date(hourlyResult.reset),
      limit: config.requestsPerHour,
      limitType: "hourly",
      pending: hourlyResult.pending,
    };
  } catch (error) {
    console.error(`Rate limit check failed for ${feature}:`, error);
    // Fail open - allow request if Redis unavailable
    return {
      success: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 3600000),
      limit: 999,
      limitType: "hourly",
      pending: Promise.resolve(),
    };
  }
}

// Convenience wrappers for backwards compatibility
export const checkAIChatRateLimit = (userId: string, plan: string) =>
  checkRateLimit(userId, plan, "chat");

export const checkAIGenerationRateLimit = (userId: string, plan: string) =>
  checkRateLimit(userId, plan, "generation");
