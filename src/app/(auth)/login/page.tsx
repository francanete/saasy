import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { appConfig } from "@/lib/config";
import { getCurrentSession } from "@/lib/dal";
import { getSafeAuthCallback } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: `Sign In | ${appConfig.name}`,
  description: `Sign in to your ${appConfig.name} account`,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = getSafeAuthCallback(params.callbackUrl);
  const session = await getCurrentSession();

  if (session) redirect(callbackUrl);

  return <LoginForm callbackUrl={callbackUrl} />;
}
