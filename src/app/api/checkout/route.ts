import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Polar } from "@polar-sh/sdk";
import { NextResponse } from "next/server";
import { getPolarProducts } from "@/lib/pricing";
import { handleApiError } from "@/lib/api-utils";
import { UnauthorizedError, BadRequestError } from "@/lib/errors";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      throw new UnauthorizedError();
    }

    const { slug } = await request.json();
    const products = getPolarProducts();
    const product = products.find((p) => p.slug === slug);

    if (!product) {
      throw new BadRequestError("Product not found");
    }

    const checkout = await polarClient.checkouts.create({
      products: [product.productId],
      customerEmail: session.user.email,
      externalCustomerId: session.user.id,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    return handleApiError(error);
  }
}
