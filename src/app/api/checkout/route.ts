import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/dal";
import { createCheckout, getCheckoutProduct } from "@/lib/checkout";
import { getOrganizationForUser } from "@/lib/organization";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const organization = await getOrganizationForUser(session.user.id);
    if (!organization || organization.role !== "owner") {
      return NextResponse.json(
        { error: "Only the organization owner can manage billing" },
        { status: 403 }
      );
    }

    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: "Product slug is required" },
        { status: 400 }
      );
    }

    if (!getCheckoutProduct(slug)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const url = await createCheckout({
      slug,
      userId: session.user.id,
      email: session.user.email,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
