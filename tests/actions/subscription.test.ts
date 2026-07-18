import { vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {},
  subscriptions: {},
}));
vi.mock("@/lib/polar-client", () => ({ polarClient: {} }));
vi.mock("@/lib/config", () => ({
  appConfig: { plans: { hierarchy: {} } },
  getPlanFromPolarProduct: vi.fn(),
}));

const mockGetCurrentSession = vi.fn();
const mockSyncWithCustomerToken = vi.fn();
const mockSyncWithPolar = vi.fn();
const mockHasPaidAccess = vi.fn();

vi.mock("@/lib/dal", () => ({
  getCurrentSession: () => mockGetCurrentSession(),
}));

vi.mock("@/lib/subscription", () => ({
  syncWithCustomerToken: (...args: unknown[]) =>
    mockSyncWithCustomerToken(...args),
  syncWithPolar: (...args: unknown[]) => mockSyncWithPolar(...args),
  hasPaidAccess: (...args: unknown[]) => mockHasPaidAccess(...args),
}));

import { syncSubscriptionAction } from "@/actions/subscription";

describe("syncSubscriptionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSession = {
    user: { id: "user-123", email: "test@example.com" },
  };

  it("returns error when not authenticated", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    const result = await syncSubscriptionAction();

    expect(result).toEqual({
      success: false,
      paymentConfirmed: false,
      error: "Not authenticated",
    });
  });

  it("with token: calls syncWithCustomerToken first (fast path)", async () => {
    mockGetCurrentSession.mockResolvedValue(mockSession);
    mockSyncWithCustomerToken.mockResolvedValue(undefined);
    mockHasPaidAccess.mockResolvedValue(true);

    await syncSubscriptionAction("session-token-abc");

    expect(mockSyncWithCustomerToken).toHaveBeenCalledWith(
      "user-123",
      "test@example.com",
      "session-token-abc"
    );
  });

  it("with token success: returns paymentConfirmed true", async () => {
    mockGetCurrentSession.mockResolvedValue(mockSession);
    mockSyncWithCustomerToken.mockResolvedValue(undefined);
    mockHasPaidAccess.mockResolvedValue(true);

    const result = await syncSubscriptionAction("session-token-abc");

    expect(result).toEqual({ success: true, paymentConfirmed: true });
  });

  it("token fails → falls back to syncWithRetries", async () => {
    mockGetCurrentSession.mockResolvedValue(mockSession);
    mockSyncWithCustomerToken.mockRejectedValue(new Error("token expired"));
    mockSyncWithPolar.mockResolvedValue(undefined);
    mockHasPaidAccess.mockResolvedValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await syncSubscriptionAction("bad-token");

    expect(mockSyncWithCustomerToken).toHaveBeenCalled();
    expect(mockSyncWithPolar).toHaveBeenCalledWith("user-123");
    expect(result.paymentConfirmed).toBe(true);
  });

  it("without token: goes directly to retry path", async () => {
    mockGetCurrentSession.mockResolvedValue(mockSession);
    mockSyncWithPolar.mockResolvedValue(undefined);
    mockHasPaidAccess.mockResolvedValue(false);

    const result = await syncSubscriptionAction();

    expect(mockSyncWithCustomerToken).not.toHaveBeenCalled();
    expect(mockSyncWithPolar).toHaveBeenCalledWith("user-123");
    expect(result).toEqual({ success: true, paymentConfirmed: false });
  });

  it("sync fails but paid access arrived → paymentConfirmed true", async () => {
    mockGetCurrentSession.mockResolvedValue(mockSession);
    mockSyncWithPolar.mockRejectedValue(new Error("API down"));
    mockHasPaidAccess.mockResolvedValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await syncSubscriptionAction();

    expect(result).toEqual({
      success: false,
      paymentConfirmed: true,
      error: "Sync failed after retries",
    });
  });
});
