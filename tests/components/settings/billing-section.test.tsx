import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import type { Subscription } from "@/lib/db/schema";

const mockPortal = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  customer: {
    portal: (...args: unknown[]) => mockPortal(...args),
  },
}));

import { BillingSection } from "@/components/settings/billing-section";

const baseSubscription: Subscription = {
  id: "subscription-1",
  userId: "user-1",
  polarCustomerId: null,
  polarSubscriptionId: null,
  polarOrderId: null,
  polarProductId: null,
  billingType: "none",
  plan: "FREE",
  status: "ACTIVE",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  nativeTrialStartedAt: null,
  nativeTrialEndsAt: null,
  lastSyncedAt: null,
  createdAt: new Date("2026-01-01T12:00:00.000Z"),
  updatedAt: new Date("2026-01-01T12:00:00.000Z"),
};

describe("BillingSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows active native-trial details and a pricing action", () => {
    render(
      <BillingSection
        subscription={{
          ...baseSubscription,
          plan: "STARTER",
          nativeTrialStartedAt: new Date("2026-01-01T12:00:00.000Z"),
          nativeTrialEndsAt: new Date("2026-01-08T12:00:00.000Z"),
        }}
      />
    );

    expect(screen.getByText("Free trial")).toBeInTheDocument();
    expect(screen.getByText("TRIAL ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("Trial ends")).toBeInTheDocument();
    expect(screen.getByText("January 8, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /choose a plan/i })
    ).toHaveAttribute("href", "/pricing");
    expect(
      screen.queryByRole("button", { name: /manage billing/i })
    ).not.toBeInTheDocument();
  });

  it("labels an expired native trial without offering billing management", () => {
    render(
      <BillingSection
        subscription={{
          ...baseSubscription,
          plan: "STARTER",
          nativeTrialStartedAt: new Date("2025-12-24T12:00:00.000Z"),
          nativeTrialEndsAt: new Date("2025-12-31T12:00:00.000Z"),
        }}
      />
    );

    expect(screen.getByText("TRIAL EXPIRED")).toBeInTheDocument();
    expect(screen.getByText("Trial ended")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /choose a plan/i })
    ).toHaveAttribute("href", "/pricing");
  });

  it("preserves billing management for a recurring paid subscription", () => {
    mockPortal.mockResolvedValue(undefined);

    render(
      <BillingSection
        subscription={{
          ...baseSubscription,
          polarCustomerId: "customer-1",
          polarSubscriptionId: "polar-subscription-1",
          polarProductId: "product-1",
          billingType: "recurring",
          plan: "GROWTH",
          currentPeriodEnd: new Date("2026-02-01T12:00:00.000Z"),
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /manage billing/i }));

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(mockPortal).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("link", { name: /choose a plan/i })
    ).not.toBeInTheDocument();
  });

  it("preserves lifetime billing information", () => {
    render(
      <BillingSection
        subscription={{
          ...baseSubscription,
          polarCustomerId: "customer-1",
          polarOrderId: "order-1",
          polarProductId: "product-1",
          billingType: "one_time",
          plan: "SCALE",
        }}
      />
    );

    expect(screen.getByText("Lifetime access")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /manage billing/i })
    ).toBeInTheDocument();
  });

  it("shows pricing instead of billing management for a free plan", () => {
    render(<BillingSection subscription={baseSubscription} />);

    expect(screen.getByText("NO SUBSCRIPTION")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /choose a plan/i })
    ).toHaveAttribute("href", "/pricing");
    expect(
      screen.queryByRole("button", { name: /manage billing/i })
    ).not.toBeInTheDocument();
  });
});
