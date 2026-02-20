import { vi, describe, it, expect, beforeEach } from "vitest";

// --- Mocks ---

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

import { POST } from "@/app/api/checkout/route";

// --- Helpers ---

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const products = [
  { slug: "starter", productId: "polar-starter-id" },
  { slug: "growth", productId: "polar-growth-id" },
];

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  mockGetPolarProducts.mockReturnValue(products);
});

describe("POST /api/checkout", () => {
  it("returns 400 when slug is missing", async () => {
    const response = await POST(makeRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("slug");
  });

  it("returns 404 when product not found", async () => {
    const response = await POST(makeRequest({ slug: "nonexistent" }));

    expect(response.status).toBe(404);
  });

  it("uses session data for logged-in user (ignores body email)", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: { id: "user-1", email: "session@example.com" },
    });
    mockCheckoutsCreate.mockResolvedValue({
      url: "https://checkout.polar.sh/123",
    });

    await POST(makeRequest({ slug: "starter", email: "body@example.com" }));

    expect(mockCheckoutsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: "session@example.com",
        externalCustomerId: "user-1",
      })
    );
  });

  it("uses body email for guest checkout", async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    mockCheckoutsCreate.mockResolvedValue({
      url: "https://checkout.polar.sh/123",
    });

    await POST(makeRequest({ slug: "starter", email: "guest@example.com" }));

    expect(mockCheckoutsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: "guest@example.com" })
    );
    expect(mockCheckoutsCreate).toHaveBeenCalledWith(
      expect.not.objectContaining({ externalCustomerId: expect.anything() })
    );
  });

  it("sets no email for full guest mode", async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    mockCheckoutsCreate.mockResolvedValue({
      url: "https://checkout.polar.sh/123",
    });

    await POST(makeRequest({ slug: "starter" }));

    const callArgs = mockCheckoutsCreate.mock.calls[0][0];
    expect(callArgs.customerEmail).toBeUndefined();
    expect(callArgs.externalCustomerId).toBeUndefined();
  });

  it("returns 500 when Polar API fails", async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    mockCheckoutsCreate.mockRejectedValue(new Error("Polar down"));

    const response = await POST(makeRequest({ slug: "starter" }));

    expect(response.status).toBe(500);
  });

  it("returns checkout URL on success", async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    mockCheckoutsCreate.mockResolvedValue({
      url: "https://checkout.polar.sh/123",
    });

    const response = await POST(makeRequest({ slug: "starter" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://checkout.polar.sh/123");
    expect(mockTrackEvent).toHaveBeenCalledWith("checkout_started", {
      profileId: undefined,
      productSlug: "starter",
    });
  });
});
