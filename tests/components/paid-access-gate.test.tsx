import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const mockGetCurrentSession = vi.fn();
vi.mock("@/lib/dal", () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
}));

const mockGetSubscriptionStatus = vi.fn();
vi.mock("@/lib/subscription", () => ({
  getSubscriptionStatus: (...args: unknown[]) =>
    mockGetSubscriptionStatus(...args),
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { PaidAccessGate } from "@/components/paid-access-gate";

const session = {
  user: { id: "user-1" },
};

const subscription = {
  status: "ACTIVE",
  billingType: "none",
  isLifetime: false,
  polarProductId: null,
  expiresAt: null,
  nativeTrialStartedAt: null,
  nativeTrialEndsAt: null,
  isNativeTrialActive: false,
};

describe("PaidAccessGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentSession.mockResolvedValue(session);
  });

  it("renders children for an active native trial with STARTER access", async () => {
    mockGetSubscriptionStatus.mockResolvedValue({
      ...subscription,
      hasAccess: true,
      plan: "STARTER",
      isNativeTrialActive: true,
    });

    render(await PaidAccessGate({ children: <p>Protected content</p> }));

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("renders the fallback for an expired native trial with a stored STARTER plan", async () => {
    mockGetSubscriptionStatus.mockResolvedValue({
      ...subscription,
      hasAccess: false,
      plan: "STARTER",
    });

    render(
      await PaidAccessGate({
        children: <p>Protected content</p>,
        fallback: <p>Upgrade required</p>,
      })
    );

    expect(screen.getByText("Upgrade required")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders the fallback when the active plan is below the required tier", async () => {
    mockGetSubscriptionStatus.mockResolvedValue({
      ...subscription,
      hasAccess: true,
      plan: "STARTER",
    });

    render(
      await PaidAccessGate({
        children: <p>Protected content</p>,
        requiredPlan: "GROWTH",
        fallback: <p>Upgrade required</p>,
      })
    );

    expect(screen.getByText("Upgrade required")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});
