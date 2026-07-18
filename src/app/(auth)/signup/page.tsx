import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignupForm } from "./signup-form";
import { appConfig } from "@/lib/config";
import { getCurrentSession } from "@/lib/dal";
import { getSafeAuthCallback } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: `Sign Up | ${appConfig.name}`,
  description: `Create your ${appConfig.name} account`,
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = getSafeAuthCallback(params.callbackUrl);
  const session = await getCurrentSession();

  if (session) redirect(callbackUrl);

  return <SignupForm callbackUrl={callbackUrl} />;
}
