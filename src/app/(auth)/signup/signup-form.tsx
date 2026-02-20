"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { appConfig } from "@/lib/config";
import { PlauderaLogo } from "@/components/plaudera-logo";
import { GoogleLogo } from "@/components/auth/google-logo";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authClient.signIn.magicLink({
        email,
        callbackURL: "/dashboard",
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send magic link"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
        <PlauderaLogo className="text-foreground mx-auto mb-4 h-10 w-10" />
        <h1 className="text-foreground mb-2 text-xl font-semibold">
          Check your email
        </h1>
        <p className="text-muted-foreground mb-4 text-sm">
          We sent a magic link to{" "}
          <strong className="text-foreground">{email}</strong>
        </p>
        <p className="text-muted-foreground text-sm">
          Click the link in your email to sign in. The link expires in 5
          minutes.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-muted-foreground hover:text-foreground mt-6 text-sm underline underline-offset-4"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border-border rounded-2xl border p-8 shadow-sm">
      <div className="mb-6 text-center">
        <PlauderaLogo className="text-foreground mx-auto mb-4 h-10 w-10" />
        <h1 className="text-foreground text-xl font-semibold">
          Create your {appConfig.name} account
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your email to get started
        </p>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-foreground mb-1 block text-sm">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-1"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground h-10 w-full rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">Or</span>
        </div>
      </div>

      <button
        disabled={loading}
        onClick={handleGoogleSignIn}
        className="border-input text-foreground hover:bg-accent flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm transition-colors disabled:opacity-50"
      >
        <GoogleLogo className="h-4 w-4" />
        Continue with Google
      </button>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-4 hover:opacity-80"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-neutral-400">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-neutral-600">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-neutral-600">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
