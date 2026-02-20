import { vi, describe, it, expect, beforeEach } from "vitest";

// --- Mocks ---

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}));

const mockHeaders = vi.fn();
vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

const mockGetSubscriptionStatus = vi.fn();
vi.mock("@/lib/subscription", () => ({
  getSubscriptionStatus: (...args: unknown[]) =>
    mockGetSubscriptionStatus(...args),
}));

const mockCheckAIRateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  checkAIRateLimit: (...args: unknown[]) => mockCheckAIRateLimit(...args),
}));

const mockFindFirst = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      users: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    },
  },
}));

vi.mock("@/lib/db/schema", () => ({
  users: { id: "id", role: "role" },
}));

const mockHandleApiError = vi.fn();
vi.mock("@/lib/api-utils", () => ({
  handleApiError: (...args: unknown[]) => mockHandleApiError(...args),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

// We need to mock React's cache to just pass through
vi.mock("react", () => ({
  cache: (fn: unknown) => fn,
}));

// --- Import after mocks ---
import {
  getCurrentSession,
  getSubscriptionFromRequest,
  requirePaidAccess,
  requireAdminAccess,
  isUserAdmin,
  protectedApiRouteWrapper,
  AuthError,
} from "@/lib/dal";

// --- Helpers ---

const mockSession = {
  user: { id: "user-1", email: "test@example.com", emailVerified: true },
};

const mockSubscription = {
  hasAccess: true,
  plan: "STARTER",
  status: "ACTIVE",
  billingType: "recurring",
  isLifetime: false,
  polarProductId: "prod-1",
  expiresAt: null,
};

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentSession", () => {
  it("returns session when authenticated", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockHeaders.mockResolvedValue(new Headers());

    const session = await getCurrentSession();
    expect(session).toEqual(mockSession);
  });

  it("returns null when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(new Headers());

    const session = await getCurrentSession();
    expect(session).toBeNull();
  });
});

describe("getSubscriptionFromRequest", () => {
  it("parses valid subscription header", async () => {
    const sub = { hasAccess: true, plan: "STARTER" };
    const headers = new Headers({
      "x-subscription-status": JSON.stringify(sub),
    });
    mockHeaders.mockResolvedValue(headers);

    const result = await getSubscriptionFromRequest();
    expect(result).toEqual(sub);
  });

  it("returns null for invalid JSON header", async () => {
    const headers = new Headers({ "x-subscription-status": "not-json" });
    mockHeaders.mockResolvedValue(headers);

    const result = await getSubscriptionFromRequest();
    expect(result).toBeNull();
  });

  it("returns null when header is missing", async () => {
    mockHeaders.mockResolvedValue(new Headers());

    const result = await getSubscriptionFromRequest();
    expect(result).toBeNull();
  });
});

describe("requirePaidAccess", () => {
  it("throws AuthError when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(new Headers());

    await expect(requirePaidAccess()).rejects.toThrow(AuthError);
    await expect(requirePaidAccess()).rejects.toThrow("Unauthorized");
  });

  it("throws AuthError when no paid access", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSubscriptionStatus.mockResolvedValue({
      hasAccess: false,
      plan: "FREE",
    });

    await expect(requirePaidAccess()).rejects.toThrow(
      "Active subscription required"
    );
  });

  it("returns userId and plan when authorized", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSubscriptionStatus.mockResolvedValue(mockSubscription);

    const result = await requirePaidAccess();
    expect(result).toEqual({ userId: "user-1", plan: "STARTER" });
  });
});

describe("requireAdminAccess", () => {
  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(new Headers());

    await expect(requireAdminAccess()).rejects.toThrow("Unauthorized");
  });

  it("throws when email not verified", async () => {
    mockGetSession.mockResolvedValue({
      user: { ...mockSession.user, emailVerified: false },
    });
    mockHeaders.mockResolvedValue(new Headers());

    await expect(requireAdminAccess()).rejects.toThrow("Email not verified");
  });

  it("throws when user not found in DB", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockHeaders.mockResolvedValue(new Headers());
    mockFindFirst.mockResolvedValue(undefined);

    await expect(requireAdminAccess()).rejects.toThrow("Admin access required");
  });

  it("throws when user is not admin", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockHeaders.mockResolvedValue(new Headers());
    mockFindFirst.mockResolvedValue({ role: "user" });

    await expect(requireAdminAccess()).rejects.toThrow("Admin access required");
  });

  it("returns userId and isAdmin when admin", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockHeaders.mockResolvedValue(new Headers());
    mockFindFirst.mockResolvedValue({ role: "admin" });

    const result = await requireAdminAccess();
    expect(result).toEqual({ userId: "user-1", isAdmin: true });
  });
});

describe("isUserAdmin", () => {
  it("returns true for admin", async () => {
    mockFindFirst.mockResolvedValue({ role: "admin" });
    expect(await isUserAdmin("user-1")).toBe(true);
  });

  it("returns false for non-admin", async () => {
    mockFindFirst.mockResolvedValue({ role: "user" });
    expect(await isUserAdmin("user-1")).toBe(false);
  });

  it("returns false when user not found", async () => {
    mockFindFirst.mockResolvedValue(undefined);
    expect(await isUserAdmin("user-1")).toBe(false);
  });
});

describe("protectedApiRouteWrapper", () => {
  const mockHandler = vi.fn();
  const mockRequest = new Request("http://localhost/api/test");

  beforeEach(() => {
    mockHeaders.mockResolvedValue(new Headers());
  });

  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    const handler = protectedApiRouteWrapper(mockHandler);

    const response = await handler(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 when no paid access", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubscriptionStatus.mockResolvedValue({
      hasAccess: false,
      plan: "FREE",
    });

    const handler = protectedApiRouteWrapper(mockHandler);
    const response = await handler(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("UPGRADE_REQUIRED");
  });

  it("skips paid check when requirePaid is false", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubscriptionStatus.mockResolvedValue({
      hasAccess: false,
      plan: "FREE",
    });
    mockHandler.mockResolvedValue(new Response("ok"));

    const handler = protectedApiRouteWrapper(mockHandler, {
      requirePaid: false,
    });
    const response = await handler(mockRequest);

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubscriptionStatus.mockResolvedValue(mockSubscription);
    const resetAt = new Date(Date.now() + 3600_000);
    mockCheckAIRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      resetAt,
      limit: 10,
    });

    const handler = protectedApiRouteWrapper(mockHandler, { rateLimit: true });
    const response = await handler(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.code).toBe("RATE_LIMIT");
    expect(body.resetAt).toBe(resetAt.toISOString());
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it("calls handler with full context on success", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubscriptionStatus.mockResolvedValue(mockSubscription);
    const rateLimitResult = {
      success: true,
      remaining: 5,
      resetAt: new Date(),
      limit: 10,
    };
    mockCheckAIRateLimit.mockResolvedValue(rateLimitResult);
    mockHandler.mockResolvedValue(new Response("ok"));

    const handler = protectedApiRouteWrapper(mockHandler, { rateLimit: true });
    await handler(mockRequest);

    expect(mockHandler).toHaveBeenCalledWith(mockRequest, {
      session: mockSession,
      subscription: mockSubscription,
      rateLimit: rateLimitResult,
      params: {},
    });
  });

  it("delegates errors to handleApiError", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubscriptionStatus.mockResolvedValue(mockSubscription);
    const error = new Error("boom");
    mockHandler.mockRejectedValue(error);
    mockHandleApiError.mockReturnValue(new Response("error", { status: 500 }));

    const handler = protectedApiRouteWrapper(mockHandler);
    const response = await handler(mockRequest);

    expect(response.status).toBe(500);
    expect(mockHandleApiError).toHaveBeenCalledWith(error);
  });
});
