import { vi } from "vitest";

// Mock database and external dependencies before importing subscription
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  }),
});

vi.mock("@/lib/db", () => ({
  db: { insert: (...args: unknown[]) => mockInsert(...args) },
  subscriptions: { userId: "userId" },
}));

const mockCustomerGet = vi.fn();
const mockSubsList = vi.fn();
const mockOrdersList = vi.fn();

vi.mock("@/lib/polar-client", () => ({
  polarClient: {
    customerPortal: {
      customers: { get: (...args: unknown[]) => mockCustomerGet(...args) },
      subscriptions: { list: (...args: unknown[]) => mockSubsList(...args) },
      orders: { list: (...args: unknown[]) => mockOrdersList(...args) },
    },
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

import { mapPolarStatus, syncWithCustomerToken } from "@/lib/subscription";

describe("mapPolarStatus", () => {
  it("maps 'active' to ACTIVE", () => {
    expect(mapPolarStatus("active")).toBe("ACTIVE");
  });

  it("maps 'canceled' to CANCELED", () => {
    expect(mapPolarStatus("canceled")).toBe("CANCELED");
  });

  it("maps 'cancelled' (UK spelling) to CANCELED", () => {
    expect(mapPolarStatus("cancelled")).toBe("CANCELED");
  });

  it("maps 'past_due' to PAST_DUE", () => {
    expect(mapPolarStatus("past_due")).toBe("PAST_DUE");
  });

  it("maps 'trialing' to TRIALING", () => {
    expect(mapPolarStatus("trialing")).toBe("TRIALING");
  });

  it("maps unknown status to CANCELED (safety default)", () => {
    expect(mapPolarStatus("unknown")).toBe("CANCELED");
  });

  it("is case insensitive", () => {
    expect(mapPolarStatus("ACTIVE")).toBe("ACTIVE");
    expect(mapPolarStatus("Active")).toBe("ACTIVE");
  });
});

describe("syncWithCustomerToken", () => {
  const userId = "user-123";
  const userEmail = "test@example.com";
  const token = "session-token-abc";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls Customer Portal API with correct session token", async () => {
    mockCustomerGet.mockResolvedValue({ id: "cust-1", email: userEmail });
    mockSubsList.mockResolvedValue({ result: { items: [] } });
    mockOrdersList.mockResolvedValue({ result: { items: [] } });

    await syncWithCustomerToken(userId, userEmail, token);

    expect(mockCustomerGet).toHaveBeenCalledWith({
      customerSession: token,
    });
    expect(mockSubsList).toHaveBeenCalledWith(
      { customerSession: token },
      { active: true }
    );
    expect(mockOrdersList).toHaveBeenCalledWith(
      { customerSession: token },
      {}
    );
  });

  it("throws when email does not match (ownership check)", async () => {
    mockCustomerGet.mockResolvedValue({
      id: "cust-1",
      email: "other@example.com",
    });

    await expect(
      syncWithCustomerToken(userId, userEmail, token)
    ).rejects.toThrow("Customer session token does not belong to this user");
  });

  it("picks subscription over order when sub has higher tier", async () => {
    mockCustomerGet.mockResolvedValue({ id: "cust-1", email: userEmail });
    mockGetPlanFromPolarProduct
      .mockReturnValueOnce("GROWTH") // subscription
      .mockReturnValueOnce("STARTER"); // order
    mockSubsList.mockResolvedValue({
      result: {
        items: [
          {
            id: "sub-1",
            product: { id: "prod-sub" },
            status: "active",
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        ],
      },
    });
    mockOrdersList.mockResolvedValue({
      result: {
        items: [{ id: "ord-1", product: { id: "prod-ord" }, paid: true }],
      },
    });

    await syncWithCustomerToken(userId, userEmail, token);

    const upsertCall = mockInsert.mock.results[0].value.values;
    const data = upsertCall.mock.calls[0][0];
    expect(data.billingType).toBe("recurring");
    expect(data.polarSubscriptionId).toBe("sub-1");
  });

  it("picks order over subscription when order has higher tier", async () => {
    mockCustomerGet.mockResolvedValue({ id: "cust-1", email: userEmail });
    mockGetPlanFromPolarProduct
      .mockReturnValueOnce("STARTER") // subscription
      .mockReturnValueOnce("SCALE"); // order
    mockSubsList.mockResolvedValue({
      result: {
        items: [
          {
            id: "sub-1",
            product: { id: "prod-sub" },
            status: "active",
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        ],
      },
    });
    mockOrdersList.mockResolvedValue({
      result: {
        items: [{ id: "ord-1", product: { id: "prod-ord" }, paid: true }],
      },
    });

    await syncWithCustomerToken(userId, userEmail, token);

    const upsertCall = mockInsert.mock.results[0].value.values;
    const data = upsertCall.mock.calls[0][0];
    expect(data.billingType).toBe("one_time");
    expect(data.polarOrderId).toBe("ord-1");
  });

  it("calls upsertSubscription with recurring billingType for subscription", async () => {
    mockCustomerGet.mockResolvedValue({ id: "cust-1", email: userEmail });
    mockGetPlanFromPolarProduct.mockReturnValue("GROWTH");
    mockSubsList.mockResolvedValue({
      result: {
        items: [
          {
            id: "sub-1",
            product: { id: "prod-sub" },
            status: "active",
            currentPeriodEnd: "2026-03-01T00:00:00Z",
            cancelAtPeriodEnd: false,
          },
        ],
      },
    });
    mockOrdersList.mockResolvedValue({ result: { items: [] } });

    await syncWithCustomerToken(userId, userEmail, token);

    const upsertCall = mockInsert.mock.results[0].value.values;
    const data = upsertCall.mock.calls[0][0];
    expect(data.billingType).toBe("recurring");
    expect(data.userId).toBe(userId);
    expect(data.polarCustomerId).toBe("cust-1");
    expect(data.status).toBe("ACTIVE");
  });

  it("calls upsertSubscription with one_time billingType for order", async () => {
    mockCustomerGet.mockResolvedValue({ id: "cust-1", email: userEmail });
    mockGetPlanFromPolarProduct.mockReturnValue("GROWTH");
    mockSubsList.mockResolvedValue({ result: { items: [] } });
    mockOrdersList.mockResolvedValue({
      result: {
        items: [{ id: "ord-1", product: { id: "prod-ord" }, paid: true }],
      },
    });

    await syncWithCustomerToken(userId, userEmail, token);

    const upsertCall = mockInsert.mock.results[0].value.values;
    const data = upsertCall.mock.calls[0][0];
    expect(data.billingType).toBe("one_time");
    expect(data.status).toBe("ACTIVE");
  });

  it("does not upsert when no subscription and no order", async () => {
    mockCustomerGet.mockResolvedValue({ id: "cust-1", email: userEmail });
    mockSubsList.mockResolvedValue({ result: { items: [] } });
    mockOrdersList.mockResolvedValue({ result: { items: [] } });

    await syncWithCustomerToken(userId, userEmail, token);

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
