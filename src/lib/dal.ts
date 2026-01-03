import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, type Session } from "./auth";
import { getSubscriptionStatus, type SubscriptionStatus } from "./subscription";
import {
  checkAIChatRateLimit,
  checkAIGenerationRateLimit,
  type RateLimitResult,
} from "./rate-limit";
import { handleApiError } from "./api-utils";

// ============ Types ============

export type AuthOptions = {
  requireSubscription?: boolean; // default: true
  rateLimit?: {
    type: "chat" | "generation";
  };
};

export type AuthContext<P = Record<string, string>> = {
  session: NonNullable<Session>;
  subscription: SubscriptionStatus;
  rateLimit?: RateLimitResult;
  params: P;
};

type RouteContext<P> = { params: Promise<P> };

type AuthHandler<P> = (
  request: Request,
  context: AuthContext<P>
) => Promise<Response>;

// ============ Session ============

export const getCurrentSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

// ============ Server Action Helper ============

export async function requirePaidAccess(): Promise<
  { userId: string } | { error: string }
> {
  const session = await getCurrentSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const subscription = await getSubscriptionStatus(session.user.id);
  if (!subscription.hasAccess) {
    return { error: "Active subscription required" };
  }

  return { userId: session.user.id };
}

// ============ API Route Wrapper ============

export function protectedApiRoute<P = Record<string, string>>(
  handler: AuthHandler<P>,
  options: AuthOptions = {}
): (request: Request, context?: RouteContext<P>) => Promise<Response> {
  const { requireSubscription = true, rateLimit } = options;

  return async (request: Request, routeContext?: RouteContext<P>) => {
    try {
      // 1. Session check (always required)
      const session = await getCurrentSession();
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }

      // 2. Subscription check (default: required)
      const subscription = await getSubscriptionStatus(session.user.id);
      if (requireSubscription && !subscription.hasAccess) {
        return NextResponse.json(
          { error: "Active subscription required", code: "FORBIDDEN" },
          { status: 403 }
        );
      }

      // 3. Rate limit check (optional)
      let rateLimitResult: RateLimitResult | undefined;
      if (rateLimit) {
        const tier = subscription.hasAccess ? "pro" : "free";
        rateLimitResult =
          rateLimit.type === "chat"
            ? await checkAIChatRateLimit(session.user.id, tier)
            : await checkAIGenerationRateLimit(session.user.id, tier);

        // Fire-and-forget analytics
        rateLimitResult.pending.catch(() => {});

        if (!rateLimitResult.success) {
          const retryAfter = Math.ceil(
            (rateLimitResult.resetAt.getTime() - Date.now()) / 1000
          );
          return NextResponse.json(
            {
              error: "Too many requests. Please wait a moment.",
              code: "RATE_LIMIT",
              resetAt: rateLimitResult.resetAt.toISOString(),
              remaining: rateLimitResult.remaining,
            },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
          );
        }
      }

      // 4. Await params for dynamic routes
      const params = routeContext?.params
        ? await routeContext.params
        : ({} as P);

      // 5. Call handler with context
      return await handler(request, {
        session,
        subscription,
        rateLimit: rateLimitResult,
        params,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}
