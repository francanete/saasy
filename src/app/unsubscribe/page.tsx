import type { Metadata } from "next";
import Link from "next/link";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Manage your email preferences",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {success ? (
          <>
            <div className="mb-4 text-4xl">&#x2713;</div>
            <h1 className="text-foreground text-2xl font-bold">Unsubscribed</h1>
            <p className="text-muted-foreground mt-2">
              You&apos;ve been unsubscribed from marketing emails. You&apos;ll
              still receive transactional emails like password resets and
              receipts.
            </p>
            <Link
              href="/"
              className="text-primary mt-6 inline-block text-sm hover:underline"
            >
              Return to {appConfig.name}
            </Link>
          </>
        ) : (
          <>
            <div className="mb-4 text-4xl">&#x2717;</div>
            <h1 className="text-foreground text-2xl font-bold">
              {error === "not-found"
                ? "Email Not Found"
                : error === "missing-email"
                  ? "Invalid Link"
                  : "Something Went Wrong"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {error === "not-found"
                ? "We couldn't find an account with that email address."
                : error === "missing-email"
                  ? "The unsubscribe link appears to be invalid."
                  : "We couldn't process your request. Please try again later."}
            </p>
            <Link
              href="/"
              className="text-primary mt-6 inline-block text-sm hover:underline"
            >
              Return to {appConfig.name}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
