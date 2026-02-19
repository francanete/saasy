import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { appConfig } from "@/lib/config";

// Route definitions
const protectedRoutes = ["/dashboard", "/checkout/success"];
const authRoutes = ["/login"];
const gateRoute = "/gate";

const REQUIRE_PAID_ACCESS = appConfig.pricing.requirePaidAccess;

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Determine route type
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isGateRoute = path.startsWith(gateRoute);

  // Strip internal headers to prevent client spoofing
  const sanitizedHeaders = new Headers(req.headers);
  sanitizedHeaders.delete("x-subscription-status");
  sanitizedHeaders.delete("x-user-id");

  // Skip public routes (no checks needed)
  if (!isProtectedRoute && !isAuthRoute && !isGateRoute) {
    return NextResponse.next({
      request: { headers: sanitizedHeaders },
    });
  }

  // Get session (uses Better Auth's 5-min cookie cache)
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // === Auth Route Logic ===
  // Redirect authenticated users away from login
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // === Protected Route Logic ===
  if (isProtectedRoute) {
    // No session → login
    if (!session) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    // Query subscription (single DB query per request)
    const subscription = await getSubscriptionStatus(session.user.id);

    // Check paid access requirement
    if (REQUIRE_PAID_ACCESS && !subscription.hasAccess) {
      return NextResponse.redirect(new URL("/gate", req.nextUrl));
    }

    // Pass subscription to Server Components via header (on sanitized headers)
    sanitizedHeaders.set("x-subscription-status", JSON.stringify(subscription));
    sanitizedHeaders.set("x-user-id", session.user.id);

    return NextResponse.next({
      request: { headers: sanitizedHeaders },
    });
  }

  // === Gate Route Logic ===
  if (isGateRoute) {
    // No session → login
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    const subscription = await getSubscriptionStatus(session.user.id);

    // Paid users shouldn't see gate - redirect to dashboard
    if (!REQUIRE_PAID_ACCESS || subscription.hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    // Pass subscription for gate page UI (on sanitized headers)
    sanitizedHeaders.set("x-subscription-status", JSON.stringify(subscription));
    sanitizedHeaders.set("x-user-id", session.user.id);

    return NextResponse.next({
      request: { headers: sanitizedHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: sanitizedHeaders },
  });
}

export const config = {
  matcher: [
    // Match all paths except static files, images, and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
