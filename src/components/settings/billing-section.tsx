"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { customer } from "@/lib/auth-client";
import type { Subscription } from "@/lib/db/schema";

interface BillingSectionProps {
  subscription: Subscription | undefined;
}

const planColors = {
  FREE: "secondary",
  STARTER: "default",
  GROWTH: "default",
  SCALE: "default",
} as const;

const statusColors = {
  ACTIVE: "default",
  TRIALING: "secondary",
  CANCELED: "destructive",
  PAST_DUE: "destructive",
} as const;

export function BillingSection({ subscription }: BillingSectionProps) {
  const plan = subscription?.plan || "FREE";
  const status = subscription?.status || "ACTIVE";
  const nativeTrialEndsAt = subscription?.nativeTrialEndsAt;
  const isNativeTrial = Boolean(
    subscription?.billingType === "none" &&
    subscription.nativeTrialStartedAt &&
    nativeTrialEndsAt
  );
  const isNativeTrialActive = Boolean(
    isNativeTrial && nativeTrialEndsAt && nativeTrialEndsAt > new Date()
  );
  const hasPaidBilling =
    plan !== "FREE" &&
    (subscription?.billingType === "recurring" ||
      subscription?.billingType === "one_time");
  const displayStatus = isNativeTrial
    ? isNativeTrialActive
      ? "TRIAL ACTIVE"
      : "TRIAL EXPIRED"
    : hasPaidBilling
      ? status
      : "NO SUBSCRIPTION";
  const statusVariant =
    isNativeTrial || !hasPaidBilling ? "secondary" : statusColors[status];

  async function handleManageBilling() {
    await customer.portal();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Review your plan and billing information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Current Plan
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-bold">{plan}</span>
              <Badge variant={planColors[plan]}>
                {isNativeTrial ? "Free trial" : plan}
              </Badge>
            </div>
          </div>
          <Badge variant={statusVariant}>{displayStatus}</Badge>
        </div>

        {isNativeTrial && nativeTrialEndsAt && (
          <>
            <Separator />
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                {isNativeTrialActive ? "Trial ends" : "Trial ended"}
              </p>
              <p className="mt-1">
                {nativeTrialEndsAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </>
        )}

        {subscription?.currentPeriodEnd && (
          <>
            <Separator />
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                {subscription.cancelAtPeriodEnd
                  ? "Access until"
                  : "Next billing date"}
              </p>
              <p className="mt-1">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Your subscription will not renew.
                </p>
              )}
            </div>
          </>
        )}

        {subscription?.billingType === "one_time" && (
          <>
            <Separator />
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Billing Type
              </p>
              <p className="mt-1">Lifetime access</p>
            </div>
          </>
        )}

        <Separator />

        <div className="flex gap-3">
          {hasPaidBilling ? (
            <Button onClick={handleManageBilling}>Manage Billing</Button>
          ) : (
            <Button asChild>
              <Link href="/pricing">Choose a Plan</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
