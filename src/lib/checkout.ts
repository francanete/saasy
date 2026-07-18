import { getPolarProducts } from "./pricing";
import { polarClient } from "./polar-client";
import { trackEvent } from "./openpanel";

export function getCheckoutProduct(slug: string) {
  return getPolarProducts().find((product) => product.slug === slug);
}

export async function createCheckout({
  slug,
  userId,
  email,
}: {
  slug: string;
  userId: string;
  email: string;
}): Promise<string> {
  const product = getCheckoutProduct(slug);

  if (!product) {
    throw new Error("Product not found");
  }

  const checkout = await polarClient.checkouts.create({
    products: [product.productId],
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
    customerEmail: email,
    externalCustomerId: userId,
  });

  trackEvent("checkout_started", {
    profileId: userId,
    productSlug: slug,
  });

  return checkout.url;
}
