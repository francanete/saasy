import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Subscription } from "@/lib/db/schema";

const mockCustomersList = vi.fn();
const mockSubscriptionsList = vi.fn();
const mockOrdersList = vi.fn();
const mockCheckoutsList = vi.fn();

vi.mock("@/lib/polar-client", () => ({
  polarClient: {
    customers: { list: (...args: unknown[]) => mockCustomersList(...args) },
    subscriptions: {
      list: (...args: unknown[]) => mockSubscriptionsList(...args),
    },
    orders: { list: (...args: unknown[]) => mockOrdersList(...args) },
    checkouts: { list: (...args: unknown[]) => mockCheckoutsList(...args) },
  },
}));

import {
  getPolarRecoveryBlockReason,
  getRecoveryBlockReasonFromState,
} from "@/lib/organization-recovery";

const trial = {
  billingType: "none",
  polarCustomerId: null,
  polarSubscriptionId: null,
  polarOrderId: null,
  polarProductId: null,
} as Subscription;

const eligible = {
  role: "owner" as const,
  userId: "user-1",
  memberUserIds: ["user-1"],
  invitationCount: 0,
  subscription: trial,
};

describe("organization recovery eligibility", () => {
  it("allows a sole owner with only a local trial", () => {
    expect(getRecoveryBlockReasonFromState(eligible)).toBeNull();
  });

  it("blocks shared organizations, outstanding invitations, and non-owners", () => {
    expect(
      getRecoveryBlockReasonFromState({
        ...eligible,
        memberUserIds: ["user-1", "user-2"],
      })
    ).toContain("other members");
    expect(
      getRecoveryBlockReasonFromState({ ...eligible, invitationCount: 1 })
    ).toContain("invitations");
    expect(
      getRecoveryBlockReasonFromState({ ...eligible, role: "admin" })
    ).toContain("owner");
  });

  it("blocks subscriptions and recorded Polar purchases", () => {
    expect(
      getRecoveryBlockReasonFromState({
        ...eligible,
        subscription: { ...trial, billingType: "recurring" },
      })
    ).toContain("billing");
    expect(
      getRecoveryBlockReasonFromState({
        ...eligible,
        subscription: { ...trial, polarOrderId: "order-1" },
      })
    ).toContain("billing");
  });
});

describe("Polar recovery verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("POLAR_ACCESS_TOKEN", "test-token");
    mockCustomersList.mockResolvedValue({
      result: { items: [{ id: "customer-1" }], pagination: { maxPage: 1 } },
    });
    mockSubscriptionsList.mockResolvedValue({ result: { items: [] } });
    mockOrdersList.mockResolvedValue({ result: { items: [] } });
    mockCheckoutsList.mockResolvedValue({
      result: { items: [], pagination: { maxPage: 1 } },
    });
  });

  it("allows a customer with no subscription, order, or open checkout", async () => {
    expect(await getPolarRecoveryBlockReason("user@example.com")).toBeNull();
    expect(mockCustomersList).toHaveBeenCalledWith({
      email: "user@example.com",
      limit: 100,
    });
    expect(mockCheckoutsList).toHaveBeenCalledWith({
      query: "user@example.com",
      status: ["open", "confirmed", "succeeded"],
      limit: 100,
    });
  });

  it("blocks a Polar subscription or open checkout", async () => {
    mockSubscriptionsList.mockResolvedValue({
      result: { items: [{ id: "sub-1" }] },
    });
    expect(await getPolarRecoveryBlockReason("user@example.com")).toContain(
      "Polar purchase"
    );

    mockSubscriptionsList.mockResolvedValue({ result: { items: [] } });
    mockCheckoutsList.mockResolvedValue({
      result: {
        items: [{ id: "checkout-1", customerEmail: "user@example.com" }],
        pagination: { maxPage: 1 },
      },
    });
    expect(await getPolarRecoveryBlockReason("user@example.com")).toContain(
      "Polar purchase"
    );
  });

  it("blocks an open checkout before Polar creates a customer", async () => {
    mockCustomersList.mockResolvedValue({
      result: { items: [], pagination: { maxPage: 1 } },
    });
    mockCheckoutsList.mockResolvedValue({
      result: {
        items: [{ id: "checkout-1", customerEmail: "USER@example.com" }],
        pagination: { maxPage: 1 },
      },
    });
    expect(await getPolarRecoveryBlockReason("user@example.com")).toContain(
      "Polar purchase"
    );
  });

  it("blocks an open checkout attached to a customer", async () => {
    mockCheckoutsList.mockImplementation(
      async (args: { customerId?: string }) => ({
        result: {
          items: args.customerId ? [{ id: "checkout-1" }] : [],
          pagination: { maxPage: 1 },
        },
      })
    );
    expect(await getPolarRecoveryBlockReason("user@example.com")).toContain(
      "Polar purchase"
    );
  });

  it("fails closed when Polar cannot be checked", async () => {
    mockCustomersList.mockRejectedValue(new Error("unavailable"));
    expect(await getPolarRecoveryBlockReason("user@example.com")).toContain(
      "could not be verified"
    );
  });
});
