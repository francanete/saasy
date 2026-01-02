import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Single Redis instance for all rate limiters
const redis = Redis.fromEnv();

// AI Chat rate limiters per subscription tier
// Using exact @upstash/ratelimit prefix for dashboard compatibility
const aiChatLimiter = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1h"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1h"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  }),
};

// AI Generation rate limiters (for server actions)
const aiGenerationLimiter = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1h"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1h"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  }),
};

export type RateLimitTier = "free" | "pro";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: Date;
  pending: Promise<unknown>; // Must be awaited or passed to waitUntil for analytics
};

/**
 * Check rate limit for AI chat endpoints
 * @param userId - The user's ID
 * @param tier - Subscription tier ("free" or "pro")
 * @returns Rate limit result with success status, remaining requests, and reset time
 */
export async function checkAIChatRateLimit(
  userId: string,
  tier: RateLimitTier = "free"
): Promise<RateLimitResult> {
  try {
    const limiter = aiChatLimiter[tier];
    const { success, remaining, reset, pending } = await limiter.limit(userId);
    return { success, remaining, resetAt: new Date(reset), pending };
  } catch (error) {
    console.error("AI chat rate limit check failed:", error);
    // Fail open - allow request if Redis unavailable
    return {
      success: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 3600000),
      pending: Promise.resolve(),
    };
  }
}

/**
 * Check rate limit for AI generation endpoints (summarize, generate content)
 * @param userId - The user's ID
 * @param tier - Subscription tier ("free" or "pro")
 * @returns Rate limit result with success status, remaining requests, and reset time
 */
export async function checkAIGenerationRateLimit(
  userId: string,
  tier: RateLimitTier = "free"
): Promise<RateLimitResult> {
  try {
    const limiter = aiGenerationLimiter[tier];
    const { success, remaining, reset, pending } = await limiter.limit(userId);
    return { success, remaining, resetAt: new Date(reset), pending };
  } catch (error) {
    console.error("AI generation rate limit check failed:", error);
    // Fail open - allow request if Redis unavailable
    return {
      success: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 3600000),
      pending: Promise.resolve(),
    };
  }
}
