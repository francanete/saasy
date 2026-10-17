import { vi, describe, it, expect, beforeEach } from "vitest";

// --- Mocks ---

const mockGetCurrentSession = vi.fn();
vi.mock("@/lib/dal", () => ({
  getCurrentSession: () => mockGetCurrentSession(),
}));

const mockGetSubscriptionStatus = vi.fn();
const mockGetOrganization = vi.fn();
vi.mock("@/lib/organization", () => ({
  getOrganizationForUser: (...args: unknown[]) => mockGetOrganization(...args),
}));
vi.mock("@/lib/subscription", () => ({
  getOrganizationSubscriptionStatus: (...args: unknown[]) =>
    mockGetSubscriptionStatus(...args),
}));

import { GET } from "@/app/api/subscription/route";

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  mockGetOrganization.mockResolvedValue({ id: "org-1", role: "member" });
});

describe("GET /api/subscription", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns subscription status when authenticated", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
    });
    mockGetSubscriptionStatus.mockResolvedValue({
      plan: "STARTER",
      hasAccess: true,
      status: "ACTIVE",
      billingType: "recurring",
      expiresAt: null,
      isLifetime: false,
      polarProductId: "prod-1",
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      plan: "STARTER",
      hasAccess: true,
      status: "ACTIVE",
      billingType: "recurring",
      expiresAt: null,
    });
    // isLifetime and polarProductId should NOT be in response
    expect(body.isLifetime).toBeUndefined();
    expect(body.polarProductId).toBeUndefined();
  });
});
