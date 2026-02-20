"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Blog error:", error);
  }, [error]);

  return (
    <div className="bg-background text-foreground min-h-screen font-sans">
      <div className="container mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-24">
        <div className="bg-destructive/10 ring-destructive/20 mb-6 rounded-full p-6 ring-1">
          <AlertCircle className="text-destructive h-10 w-10" />
        </div>

        <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Something went wrong
        </h1>

        <p className="text-muted-foreground mb-2 max-w-md text-center text-lg">
          We encountered an error while loading this blog content.
        </p>

        {error.digest && (
          <p className="text-muted-foreground mb-8 text-xs">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={reset}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Try Again
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/blog">Back to Blog</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
