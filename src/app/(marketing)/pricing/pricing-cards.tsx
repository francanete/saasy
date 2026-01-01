"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import type { PlanDisplay } from "@/lib/pricing";

interface PricingCardsProps {
  plans: PlanDisplay[];
}

export function PricingCards({ plans }: PricingCardsProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  async function handleCheckout(plan: PlanDisplay) {
    if (!plan.slug) return;

    // Require authentication before checkout
    if (!session) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    setLoadingPlan(plan.name);
    setError(null);

    try {
      // Uses custom checkout endpoint with customerEmail support
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: plan.slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Failed to start checkout. Please try again.");
      setLoadingPlan(null);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-8 rounded-lg bg-red-50 p-4 text-center text-red-600">
          {error}
        </div>
      )}

      <div
        className={`mx-auto grid max-w-5xl gap-8 ${
          plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
        }`}
      >
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${
              plan.highlighted
                ? "border-primary scale-105 shadow-lg"
                : "border-border"
            }`}
          >
            {plan.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                {plan.badge}
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                {plan.originalPrice && (
                  <span className="text-muted-foreground mr-2 text-lg line-through">
                    {plan.originalPrice}
                  </span>
                )}
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="text-primary h-4 w-4" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.href ? (
                <Button
                  asChild
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  disabled={loadingPlan === plan.name}
                  onClick={() => handleCheckout(plan)}
                >
                  {loadingPlan === plan.name ? "Loading..." : plan.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
