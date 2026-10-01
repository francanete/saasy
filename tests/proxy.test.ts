import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

const mockGetSubscriptionStatus = vi.fn();
vi.mock("@/lib/subscription", () => ({
  getSubscriptionStatus: (...args: unknown[]) =>
    mockGetSubscriptionStatus(...args),
}));

import { proxy } from "@/proxy";

const session = {
  user: { id: "user-1", email: "user@example.com" },
};

const unpaidSubscription = {
  hasAccess: false,
  hasPaidAccess: false,
  status: "ACTIVE",
  billingType: "none",
  isLifetime: false,
  plan: "STARTER",
  polarProductId: null,
  expiresAt: null,
  nativeTrialStartedAt: new Date("2025-12-24T12:00:00.000Z"),
  nativeTrialEndsAt: new Date("2025-12-31T12:00:00.000Z"),
  isNativeTrialActive: false,
};

const activeTrialSubscription = {
  ...unpaidSubscription,
  hasAccess: true,
  nativeTrialStartedAt: new Date("2026-01-01T12:00:00.000Z"),
  nativeTrialEndsAt: new Date("2026-01-08T12:00:00.000Z"),
  isNativeTrialActive: true,
};

const paidSubscription = {
  ...unpaidSubscription,
  hasAccess: true,
  hasPaidAccess: true,
  billingType: "recurring",
  plan: "GROWTH",
  polarProductId: "product-1",
  expiresAt: new Date("2026-02-01T12:00:00.000Z"),
  nativeTrialStartedAt: null,
  nativeTrialEndsAt: null,
};

function makeRequest(path: string, headers?: HeadersInit) {
  return new NextRequest(`http://localhost${path}`, { headers });
}

function getLocationPath(response: Response) {
  return new URL(response.headers.get("location")!).pathname;
}

function getForwardedHeader(response: Response, name: string) {
  return response.headers.get(`x-middleware-request-${name}`);
}

beforeEach(() => {
  mockGetSession.mockReset();
  mockGetSubscriptionStatus.mockReset();
});

describe("proxy dashboard access", () => {
  it("redirects an unauthenticated user to login with the dashboard callback", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await proxy(makeRequest("/dashboard"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/dashboard");
    expect(mockGetSubscriptionStatus).not.toHaveBeenCalled();
  });

  it("allows an active native trial and replaces untrusted internal headers", async () => {
    mockGetSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(activeTrialSubscription);

    const response = await proxy(
      makeRequest("/dashboard", {
        "x-user-id": "spoofed-user",
        "x-subscription-status": JSON.stringify({ hasAccess: false }),
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(getForwardedHeader(response, "x-user-id")).toBe("user-1");
    expect(getForwardedHeader(response, "x-subscription-status")).toBe(
      JSON.stringify(activeTrialSubscription)
    );
    expect(mockGetSubscriptionStatus).toHaveBeenCalledWith("user-1");
  });

  it("redirects an expired native trial to the gate", async () => {
    mockGetSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(unpaidSubscription);

    const response = await proxy(makeRequest("/dashboard"));

    expect(response.status).toBe(307);
    expect(getLocationPath(response)).toBe("/gate");
  });

  it("allows a paid user and forwards trusted subscription state", async () => {
    mockGetSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(paidSubscription);

    const response = await proxy(makeRequest("/dashboard/settings"));

    expect(response.status).toBe(200);
    expect(getForwardedHeader(response, "x-user-id")).toBe("user-1");
    expect(getForwardedHeader(response, "x-subscription-status")).toBe(
      JSON.stringify(paidSubscription)
    );
  });
});

describe("proxy gate access", () => {
  it("redirects an unauthenticated user to login", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await proxy(makeRequest("/gate"));

    expect(response.status).toBe(307);
    expect(getLocationPath(response)).toBe("/login");
    expect(mockGetSubscriptionStatus).not.toHaveBeenCalled();
  });

  it("redirects an active native trial to the dashboard", async () => {
    mockGetSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(activeTrialSubscription);

    const response = await proxy(makeRequest("/gate"));

    expect(response.status).toBe(307);
    expect(getLocationPath(response)).toBe("/dashboard");
  });

  it("allows an expired native trial through with trusted status headers", async () => {
    mockGetSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(unpaidSubscription);

    const response = await proxy(
      makeRequest("/gate", {
        "x-user-id": "spoofed-user",
        "x-subscription-status": JSON.stringify({ hasAccess: true }),
      })
    );

    expect(response.status).toBe(200);
    expect(getForwardedHeader(response, "x-user-id")).toBe("user-1");
    expect(getForwardedHeader(response, "x-subscription-status")).toBe(
      JSON.stringify(unpaidSubscription)
    );
  });

  it("redirects a paid user to the dashboard", async () => {
    mockGetSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(paidSubscription);

    const response = await proxy(makeRequest("/gate"));

    expect(response.status).toBe(307);
    expect(getLocationPath(response)).toBe("/dashboard");
  });
});
