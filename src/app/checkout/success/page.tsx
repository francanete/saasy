import type { Metadata } from "next";
import { CheckoutSuccessContent } from "@/components/checkout-success-content";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Confirming Payment | ${appConfig.name}`,
  description: "Confirming your payment status",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_session_token?: string }>;
}) {
  const { customer_session_token } = await searchParams;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="max-w-md px-4">
        <CheckoutSuccessContent customerSessionToken={customer_session_token} />
      </div>
    </div>
  );
}
