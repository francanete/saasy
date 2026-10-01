import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/dal";
import { createCheckout, getCheckoutProduct } from "@/lib/checkout";

function redirectToPricing(request: NextRequest, reason: string) {
  const url = new URL("/pricing", request.url);
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug || !getCheckoutProduct(slug)) {
    return redirectToPricing(request, "invalid-plan");
  }

  const session = await getCurrentSession();

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `/checkout/continue?slug=${encodeURIComponent(slug)}`
    );
    return NextResponse.redirect(loginUrl);
  }

  try {
    const checkoutUrl = await createCheckout({
      slug,
      userId: session.user.id,
      email: session.user.email,
    });

    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    console.error("Checkout continuation error:", error);
    return redirectToPricing(request, "checkout-failed");
  }
}
