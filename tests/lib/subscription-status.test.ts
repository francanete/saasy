import { vi, describe, it, expect, beforeEach } from "vitest";

// --- Mocks ---

const mockFindFirst = vi.fn();
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  }),
});
const mockUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  }),
});
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      subscriptions: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
  subscriptions: {
    userId: "userId",
    polarSubscriptionId: "polarSubscriptionId",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

const mockGetExternal = vi.fn();
const mockSubsList = vi.fn();
const mockOrdersList = vi.fn();

vi.mock("@/lib/polar-client", () => ({
  polarClient: {
    customers: {
      getExternal: (...args: unknown[]) => mockGetExternal(...args),
    },
    subscriptions: { list: (...args: unknown[]) => mockSubsList(...args) },
    orders: { list: (...args: unknown[]) => mockOrdersList(...args) },
  },
}));

const mockGetPlanFromPolarProduct = vi.fn();
vi.mock("@/lib/config", () => ({
  appConfig: {
    plans: { hierarchy: { FREE: 0, STARTER: 1, GROWTH: 2, SCALE: 3 } },
  },
  getPlanFromPolarProduct: (...args: unknown[]) =>
    mockGetPlanFromPolarProduct(...args),
}));

import {
  getSubscriptionStatus,
  syncWithPolar,
  hasPaidAccess,
  upsertSubscription,
  updateSubscriptionStatus,
} from "@/lib/subscription";

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getSubscriptionStatus", () => {
  it("returns ACTIVE subscription with hasAccess true", async () => {
    mockFindFirst.mockResolvedValue({
      status: "ACTIVE",
      plan: "STARTER",
      billingType: "recurring",
      polarProductId: "prod-1",
      currentPeriodEnd: null,
    });

    const result = await getSubscriptionStatus("user-1");

    expect(result.hasAccess).toBe(true);
    expect(result.plan).toBe("STARTER");
    expect(result.isLifetime).toBe(false);
  });

  it("returns TRIALING subscription with hasAccess true", async () => {
    mockFindFirst.mockResolvedValue({
      status: "TRIALING",
      plan: "GROWTH",
      billingType: "recurring",
      polarProductId: "prod-2",
      currentPeriodEnd: new Date("2026-03-01"),
    });

    const result = await getSubscriptionStatus("user-1");

    expect(result.hasAccess).toBe(true);
    expect(result.plan).toBe("GROWTH");
    expect(result.status).toBe("TRIALING");
  });

  it("returns active native trial with hasAccess true", async () => {
    const now = new Date();
    mockFindFirst.mockResolvedValue({
      status: "ACTIVE",
      plan: "FREE",
      billingType: "none",
      polarProductId: null,
      currentPeriodEnd: null,
      nativeTrialStartedAt: now,
      nativeTrialEndsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    });

    const result = await getSubscriptionStatus("user-1");

    expect(result.hasAccess).toBe(true);
    expect(result.isNativeTrialActive).toBe(true);
    expect(result.nativeTrialEndsAt).toBeInstanceOf(Date);
  });

  it("returns expired native trial with hasAccess false", async () => {
    const now = new Date();
    mockFindFirst.mockResolvedValue({
      status: "ACTIVE",
      plan: "STARTER",
      billingType: "none",
      polarProductId: null,
      currentPeriodEnd: null,
      nativeTrialStartedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      nativeTrialEndsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    const result = await getSubscriptionStatus("user-1");

    expect(result.hasAccess).toBe(false);
    expect(result.isNativeTrialActive).toBe(false);
  });

  it("returns CANCELED with hasAccess false (plan unchanged)", async () => {
    mockFindFirst.mockResolvedValue({
      status: "CANCELED",
      plan: "STARTER",
      billingType: "recurring",
      polarProductId: "prod-1",
      currentPeriodEnd: null,
    });

    const result = await getSubscriptionStatus("user-1");

    expect(result.hasAccess).toBe(false);
    expect(result.plan).toBe("STARTER");
  });

  it("returns PAST_DUE with hasAccess false (plan unchanged)", async () => {
    mockFindFirst.mockResolvedValue({
      status: "PAST_DUE",
      plan: "STARTER",
      billingType: "recurring",
      polarProductId: "prod-1",
      currentPeriodEnd: null,
    });

    const result = await getSubscriptionStatus("user-1");

    expect(result.hasAccess).toBe(false);
    expect(result.plan).toBe("STARTER");
  });

  it("creates FREE record when no subscription exists", async () => {
    // First call: no record, second call: newly created record
    mockFindFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      status: "ACTIVE",
      plan: "FREE",
      billingType: "none",
      polarProductId: null,
      currentPeriodEnd: null,
    });

    const result = await getSubscriptionStatus("user-1");

    expect(mockInsert).toHaveBeenCalled();
    expect(result.plan).toBe("FREE");
    expect(result.hasAccess).toBe(false);
  });

  it("returns NONE fallback on race condition", async () => {
    mockFindFirst.mockResolvedValue(undefined);

    const result = await getSubscriptionStatus("user-1");

    expect(result.hasAccess).toBe(false);
    expect(result.status).toBe("NONE");
    expect(result.plan).toBe("FREE");
  });

  it("returns isLifetime true for one_time billing", async () => {
    mockFindFirst.mockResolvedValue({
      status: "ACTIVE",
      plan: "SCALE",
      billingType: "one_time",
      polarProductId: "prod-ltd",
      currentPeriodEnd: null,
    });

    const result = await getSubscriptionStatus("user-1");

    expect(result.isLifetime).toBe(true);
    expect(result.hasAccess).toBe(true);
  });
});

describe("syncWithPolar", () => {
  const customer = { id: "cust-1" };

  it("upserts recurring when active subscription has higher tier", async () => {
    mockGetExternal.mockResolvedValue(customer);
    mockSubsList.mockResolvedValue({
      result: {
        items: [
          {
            id: "sub-1",
            status: "active",
            product: { id: "prod-starter" },
            currentPeriodEnd: "2026-04-01",
            cancelAtPeriodEnd: false,
          },
        ],
      },
    });
    mockOrdersList.mockResolvedValue({ result: { items: [] } });
    mockGetPlanFromPolarProduct.mockReturnValue("STARTER");
    // Re-mock insert for upsertSubscription
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    });

    await syncWithPolar("user-1");

    expect(mockInsert).toHaveBeenCalled();
  });

  it("upserts one_time when paid order has higher tier", async () => {
    mockGetExternal.mockResolvedValue(customer);
    mockSubsList.mockResolvedValue({ result: { items: [] } });
    mockOrdersList.mockResolvedValue({
      result: {
        items: [{ id: "order-1", paid: true, product: { id: "prod-scale" } }],
      },
    });
    mockGetPlanFromPolarProduct.mockReturnValue("SCALE");
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    });

    await syncWithPolar("user-1");

    expect(mockInsert).toHaveBeenCalled();
  });

  it("downgrades to FREE when no active sub or order", async () => {
    mockGetExternal.mockResolvedValue(customer);
    mockSubsList.mockResolvedValue({ result: { items: [] } });
    mockOrdersList.mockResolvedValue({ result: { items: [] } });

    await syncWithPolar("user-1");

    expect(mockUpdate).toHaveBeenCalled();
  });

  it("marks synced on 404 (customer not found)", async () => {
    const mockSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    mockUpdate.mockReturnValue({ set: mockSet });
    mockGetExternal.mockRejectedValue({ status: 404 });

    await syncWithPolar("user-1");

    expect(mockUpdate).toHaveBeenCalled();
    const setArg = mockSet.mock.calls[0][0];
    expect(setArg).toHaveProperty("lastSyncedAt");
    // Should NOT downgrade plan — only update sync timestamp
    expect(setArg).not.toHaveProperty("plan");
  });

  it("re-throws non-404 errors", async () => {
    const error = { status: 500, message: "Server error" };
    mockGetExternal.mockRejectedValue(error);

    await expect(syncWithPolar("user-1")).rejects.toEqual(error);
  });
});

describe("hasPaidAccess", () => {
  it("returns true for active paid plan", async () => {
    mockFindFirst.mockResolvedValue({
      status: "ACTIVE",
      plan: "STARTER",
      billingType: "recurring",
      polarProductId: "prod-1",
      currentPeriodEnd: null,
    });

    expect(await hasPaidAccess("user-1")).toBe(true);
  });

  it("returns false for FREE plan", async () => {
    mockFindFirst.mockResolvedValue({
      status: "ACTIVE",
      plan: "FREE",
      billingType: "none",
      polarProductId: null,
      currentPeriodEnd: null,
    });

    expect(await hasPaidAccess("user-1")).toBe(false);
  });

  it("returns false for canceled paid plan", async () => {
    mockFindFirst.mockResolvedValue({
      status: "CANCELED",
      plan: "STARTER",
      billingType: "recurring",
      polarProductId: "prod-1",
      currentPeriodEnd: null,
    });

    expect(await hasPaidAccess("user-1")).toBe(false);
  });
});

describe("upsertSubscription", () => {
  it("calls db insert with correct values", async () => {
    mockGetPlanFromPolarProduct.mockReturnValue("STARTER");
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    });

    await upsertSubscription({
      userId: "user-1",
      polarCustomerId: "cust-1",
      polarSubscriptionId: "sub-1",
      polarProductId: "prod-1",
      billingType: "recurring",
      status: "ACTIVE",
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(mockGetPlanFromPolarProduct).toHaveBeenCalledWith("prod-1");
  });
});

describe("updateSubscriptionStatus", () => {
  it("updates by polarSubscriptionId", async () => {
    await updateSubscriptionStatus({
      polarSubscriptionId: "sub-1",
      status: "CANCELED",
    });

    expect(mockUpdate).toHaveBeenCalled();
  });
});
