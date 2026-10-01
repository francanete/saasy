import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

const mockGetCurrentSession = vi.fn();
const mockGetSubscriptionFromRequest = vi.fn();
const mockGetSubscriptionStatus = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/lib/dal", () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
  getSubscriptionFromRequest: (...args: unknown[]) =>
    mockGetSubscriptionFromRequest(...args),
}));

vi.mock("@/lib/subscription", () => ({
  getSubscriptionStatus: (...args: unknown[]) =>
    mockGetSubscriptionStatus(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

vi.mock("@/components/pricing/pricing-section", () => ({
  PricingSection: () => <div>Pricing options</div>,
}));

import GatePage from "@/app/gate/page";

const session = { user: { id: "user-1" } };
const unpaidSubscription = {
  hasAccess: false,
  hasPaidAccess: false,
  status: "ACTIVE",
  billingType: "none",
  isLifetime: false,
  plan: "FREE",
  polarProductId: null,
  expiresAt: null,
  nativeTrialStartedAt: null,
  nativeTrialEndsAt: null,
  isNativeTrialActive: false,
};

describe("GatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    mockGetCurrentSession.mockResolvedValue(session);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("explains an expired native trial before showing pricing", async () => {
    mockGetSubscriptionFromRequest.mockResolvedValue({
      ...unpaidSubscription,
      plan: "STARTER",
      nativeTrialStartedAt: "2025-12-24T12:00:00.000Z",
      nativeTrialEndsAt: "2025-12-31T12:00:00.000Z",
    });

    render(await GatePage());

    expect(
      screen.getByRole("heading", { name: /your free trial has ended/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your trial ended on december 31, 2025/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Pricing options")).toBeInTheDocument();
  });

  it("keeps generic pricing for an unpaid user without trial history", async () => {
    mockGetSubscriptionFromRequest.mockResolvedValue(unpaidSubscription);

    render(await GatePage());

    expect(
      screen.queryByRole("heading", { name: /your free trial has ended/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Pricing options")).toBeInTheDocument();
  });

  it("redirects an active native trial away from the gate", async () => {
    mockGetSubscriptionFromRequest.mockResolvedValue({
      ...unpaidSubscription,
      hasAccess: true,
      plan: "STARTER",
      nativeTrialStartedAt: "2026-01-01T12:00:00.000Z",
      nativeTrialEndsAt: "2026-01-08T12:00:00.000Z",
      isNativeTrialActive: true,
    });
    mockRedirect.mockImplementation(() => {
      throw new Error("redirected");
    });

    await expect(GatePage()).rejects.toThrow("redirected");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects a paid user away from the gate", async () => {
    mockGetSubscriptionFromRequest.mockResolvedValue({
      ...unpaidSubscription,
      hasAccess: true,
      hasPaidAccess: true,
      billingType: "recurring",
      plan: "GROWTH",
    });
    mockRedirect.mockImplementation(() => {
      throw new Error("redirected");
    });

    await expect(GatePage()).rejects.toThrow("redirected");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });
});
