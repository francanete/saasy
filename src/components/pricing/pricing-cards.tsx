"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import type { TierPricingDisplay, PricingMode } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface PricingCardsProps {
  tiers: TierPricingDisplay[];
  mode: PricingMode;
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="group flex items-start gap-3">
      <div className="border-muted bg-muted/50 group-hover:border-primary/20 group-hover:bg-primary/5 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200">
        <Check className="text-foreground h-3 w-3" strokeWidth={3} />
      </div>
      <span className="text-muted-foreground group-hover:text-foreground text-[15px] leading-tight font-medium transition-colors duration-200">
        {text}
      </span>
    </li>
  );
}

interface LtdCardProps {
  tier: TierPricingDisplay;
  isLoading: boolean;
  onCheckout: (slug: string) => void;
}

function LtdCard({ tier, isLoading, onCheckout }: LtdCardProps) {
  return (
    <div className="border-border bg-card relative w-full max-w-[440px] overflow-visible rounded-2xl border shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* Badge - upper right */}
      <span className="absolute -top-3 right-4 inline-flex items-center rounded-full border border-emerald-100/50 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950 dark:text-emerald-400">
        One-time payment
      </span>

      {/* Header / Pricing Section */}
      <div className="border-border/50 border-b px-8 py-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-3">
          {tier.originalLtdPrice && (
            <span className="text-muted-foreground/60 text-2xl font-medium line-through">
              {tier.originalLtdPrice}
            </span>
          )}
          <span className="text-foreground text-5xl font-bold tracking-tight">
            {tier.ltdPrice}
          </span>
        </div>

        <p className="text-muted-foreground text-sm">{tier.description}</p>
      </div>

      {/* Features List */}
      <div className="bg-card px-8 py-8">
        <ul className="space-y-4">
          {tier.features.map((feature) => (
            <FeatureItem key={feature} text={feature} />
          ))}
        </ul>

        {/* CTA Button */}
        <div className="mt-10">
          <button
            className="group bg-primary text-primary-foreground shadow-primary/10 hover:bg-primary/90 focus:ring-ring relative flex w-full items-center justify-center overflow-hidden rounded-xl px-6 py-4 font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            onClick={() => onCheckout(tier.ltdSlug)}
            disabled={isLoading}
            aria-label={`${tier.cta} for ${tier.ltdPrice}`}
          >
            <span className="relative z-10 text-[17px]">
              {isLoading ? "Loading..." : tier.cta}
            </span>
            <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 ease-out group-hover:translate-y-0" />
          </button>
          <p className="text-muted-foreground mt-4 text-center text-xs font-medium">
            30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}

interface SubscriptionCardProps {
  tier: TierPricingDisplay;
  price: string;
  originalPrice?: string | null;
  period: string;
  slug: string;
  badge?: string;
  isHighlighted: boolean;
  isLoading: boolean;
  onCheckout: (slug: string) => void;
}

function SubscriptionCard({
  tier,
  price,
  originalPrice,
  period,
  slug,
  badge,
  isHighlighted,
  isLoading,
  onCheckout,
}: SubscriptionCardProps) {
  return (
    <div
      className={cn(
        "bg-card relative w-full overflow-visible rounded-2xl border transition-all duration-300 sm:w-80",
        isHighlighted
          ? "border-border shadow-lg hover:shadow-xl"
          : "border-border hover:border-border shadow-sm hover:shadow-md"
      )}
    >
      {/* Badge - upper right */}
      {badge && (
        <span className="absolute -top-3 right-4 inline-flex items-center rounded-full border border-emerald-100/50 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950 dark:text-emerald-400">
          {badge}
        </span>
      )}

      {/* Header / Pricing Section */}
      <div className="border-border/50 border-b px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-2">
          {originalPrice && (
            <span className="text-muted-foreground/60 text-lg font-medium line-through">
              {originalPrice}
            </span>
          )}
          <span
            className={cn(
              "font-bold tracking-tight",
              isHighlighted
                ? "text-foreground text-4xl"
                : "text-muted-foreground text-3xl"
            )}
          >
            {price}
          </span>
          <span className="text-muted-foreground text-sm">{period}</span>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-card px-6 py-6">
        <ul className="space-y-3">
          {tier.features.slice(0, 5).map((feature) => (
            <FeatureItem key={feature} text={feature} />
          ))}
        </ul>

        {/* CTA Button */}
        <div className="mt-8">
          {isHighlighted ? (
            <button
              className="group bg-primary text-primary-foreground shadow-primary/10 hover:bg-primary/90 focus:ring-ring relative flex w-full items-center justify-center overflow-hidden rounded-xl px-6 py-3.5 font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              onClick={() => onCheckout(slug)}
              disabled={isLoading}
            >
              <span className="relative z-10">
                {isLoading ? "Loading..." : tier.cta}
              </span>
              <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 ease-out group-hover:translate-y-0" />
            </button>
          ) : (
            <button
              className="border-border bg-card text-muted-foreground hover:border-border hover:bg-muted focus:ring-ring w-full rounded-xl border px-6 py-3.5 font-semibold transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              onClick={() => onCheckout(slug)}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : tier.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PricingCards({ tiers, mode }: PricingCardsProps) {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  async function handleCheckout(slug: string) {
    if (!session) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    setLoadingSlug(slug);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (!data.url) {
        throw new Error("No checkout URL received");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to start checkout. Please try again.");
      setLoadingSlug(null);
    }
  }

  const isLtdMode = mode === "ltd";

  return (
    <section className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-5xl space-y-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
            {isLtdMode ? "Get Lifetime Access" : "Select the Best Plan for You"}
          </h2>
          <p className="text-muted-foreground text-lg sm:text-xl">
            {isLtdMode
              ? "Pay once, use forever. No recurring fees."
              : "Choose monthly flexibility or save with annual billing."}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center">
            {error}
          </div>
        )}

        {/* Pricing cards */}
        {tiers.map((tier) => (
          <div key={tier.tier} className="space-y-6">
            {/* Tier header - only show in subscription mode */}
            {!isLtdMode && (
              <div className="text-center">
                <h3 className="text-xl font-semibold sm:text-2xl">
                  {tier.name}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  {tier.description}
                </p>
              </div>
            )}

            {/* Cards container */}
            <div className="flex items-stretch justify-center gap-4 max-sm:flex-col max-sm:items-center sm:gap-6">
              {isLtdMode ? (
                <LtdCard
                  tier={tier}
                  isLoading={loadingSlug === tier.ltdSlug}
                  onCheckout={handleCheckout}
                />
              ) : (
                <>
                  <SubscriptionCard
                    tier={tier}
                    price={tier.monthlyPrice}
                    originalPrice={tier.originalMonthlyPrice}
                    period="/month"
                    slug={tier.monthlySlug}
                    isHighlighted={false}
                    isLoading={loadingSlug === tier.monthlySlug}
                    onCheckout={handleCheckout}
                  />
                  <SubscriptionCard
                    tier={tier}
                    price={tier.annualPrice}
                    originalPrice={tier.originalAnnualPrice}
                    period="/year"
                    slug={tier.annualSlug}
                    badge={
                      tier.annualSavings
                        ? `Save ${tier.annualSavings}`
                        : "Best Value"
                    }
                    isHighlighted={true}
                    isLoading={loadingSlug === tier.annualSlug}
                    onCheckout={handleCheckout}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
