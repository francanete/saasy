import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetCurrentSession = vi.fn();
vi.mock("@/lib/dal", () => ({
  getCurrentSession: () => mockGetCurrentSession(),
}));

const mockGetPolarProducts = vi.fn();
vi.mock("@/lib/pricing", () => ({
  getPolarProducts: () => mockGetPolarProducts(),
}));

const mockCheckoutsCreate = vi.fn();
vi.mock("@/lib/polar-client", () => ({
  polarClient: {
    checkouts: { create: (...args: unknown[]) => mockCheckoutsCreate(...args) },
  },
}));

const mockTrackEvent = vi.fn();
vi.mock("@/lib/openpanel", () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

import { GET } from "@/app/checkout/continue/route";

const products = [
  { slug: "starter-monthly", productId: "polar-starter-monthly" },
];

function makeRequest(url: string) {
  return new NextRequest(`http://localhost${url}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  mockGetPolarProducts.mockReturnValue(products);
});

describe("GET /checkout/continue", () => {
  it("redirects unauthenticated users to login with the selected slug", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    const response = await GET(
      makeRequest("/checkout/continue?slug=starter-monthly")
    );
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe(
      "/checkout/continue?slug=starter-monthly"
    );
    expect(mockCheckoutsCreate).not.toHaveBeenCalled();
  });

  it("redirects an authenticated user to the selected Polar checkout", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    mockCheckoutsCreate.mockResolvedValue({
      url: "https://checkout.polar.sh/checkout-1",
    });

    const response = await GET(
      makeRequest("/checkout/continue?slug=starter-monthly")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://checkout.polar.sh/checkout-1"
    );
    expect(mockCheckoutsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        products: ["polar-starter-monthly"],
        customerEmail: "user@example.com",
        externalCustomerId: "user-1",
      })
    );
  });

  it("rejects an unavailable product before authentication", async () => {
    const response = await GET(
      makeRequest("/checkout/continue?slug=not-a-product")
    );
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/pricing");
    expect(location.searchParams.get("reason")).toBe("invalid-plan");
    expect(mockGetCurrentSession).not.toHaveBeenCalled();
  });
});
