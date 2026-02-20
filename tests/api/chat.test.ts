import { vi, describe, it, expect, beforeEach } from "vitest";

// --- Mocks ---

const mockGetCurrentSession = vi.fn();
const mockGetSubscriptionStatus = vi.fn();
const mockCheckAIRateLimit = vi.fn();
const mockHandleApiError = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: () => mockGetCurrentSession() } },
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

vi.mock("react", () => ({
  cache: (fn: unknown) => fn,
}));

vi.mock("@/lib/subscription", () => ({
  getSubscriptionStatus: (...args: unknown[]) =>
    mockGetSubscriptionStatus(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkAIRateLimit: (...args: unknown[]) => mockCheckAIRateLimit(...args),
}));

vi.mock("@/lib/api-utils", () => ({
  handleApiError: (...args: unknown[]) => mockHandleApiError(...args),
}));

const mockStreamText = vi.fn();
vi.mock("ai", () => ({
  streamText: (...args: unknown[]) => mockStreamText(...args),
}));

vi.mock("@/lib/ai-usage", () => ({
  trackAIUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/ai", () => ({
  models: { flash: "flash-model", pro: "pro-model" },
}));

vi.mock("@/lib/config", () => ({
  appConfig: { name: "TestApp" },
}));

vi.mock("@/lib/errors", () => ({
  BadRequestError: class BadRequestError extends Error {
    code = "BAD_REQUEST";
    statusCode = 400;
    constructor(message: string) {
      super(message);
      this.name = "AppError";
    }
  },
}));

import { POST } from "@/app/api/chat/route";

// --- Helpers ---

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const session = {
  user: { id: "user-1", email: "test@example.com" },
};

const subscription = {
  hasAccess: true,
  plan: "STARTER",
  status: "ACTIVE",
};

const happyRateLimit = {
  success: true,
  remaining: 5,
  resetAt: new Date(),
  limit: 10,
};

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/chat", () => {
  it("returns 401 when no session", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    const response = await POST(makeRequest({ messages: [] }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 when no paid access", async () => {
    mockGetCurrentSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue({
      hasAccess: false,
      plan: "FREE",
    });

    const response = await POST(makeRequest({ messages: [] }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("UPGRADE_REQUIRED");
  });

  it("returns 429 when rate limited", async () => {
    mockGetCurrentSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(subscription);
    mockCheckAIRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      resetAt: new Date(),
      limit: 10,
    });

    const response = await POST(makeRequest({ messages: [] }));

    expect(response.status).toBe(429);
  });

  it("handles invalid model via handleApiError", async () => {
    mockGetCurrentSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(subscription);
    mockCheckAIRateLimit.mockResolvedValue(happyRateLimit);
    mockHandleApiError.mockReturnValue(
      new Response(JSON.stringify({ error: "Invalid model" }), { status: 400 })
    );

    const response = await POST(
      makeRequest({ messages: [], model: "nonexistent" })
    );

    expect(response.status).toBe(400);
    expect(mockHandleApiError).toHaveBeenCalled();
  });

  it("streams response on success", async () => {
    mockGetCurrentSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(subscription);
    mockCheckAIRateLimit.mockResolvedValue(happyRateLimit);

    const mockStreamResponse = new Response("streamed data", { status: 200 });
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => mockStreamResponse,
    });

    const response = await POST(
      makeRequest({
        messages: [{ role: "user", content: "Hello" }],
        model: "flash",
      })
    );

    expect(response.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalled();
  });

  it("maps messages with parts array correctly", async () => {
    mockGetCurrentSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(subscription);
    mockCheckAIRateLimit.mockResolvedValue(happyRateLimit);
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => new Response("ok"),
    });

    await POST(
      makeRequest({
        messages: [
          {
            role: "user",
            parts: [
              { type: "text", text: "Hello " },
              { type: "text", text: "world" },
            ],
          },
        ],
      })
    );

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.messages[0].content).toBe("Hello world");
  });

  it("falls back to msg.content when parts is absent", async () => {
    mockGetCurrentSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(subscription);
    mockCheckAIRateLimit.mockResolvedValue(happyRateLimit);
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => new Response("ok"),
    });

    await POST(
      makeRequest({
        messages: [{ role: "user", content: "Plain content" }],
      })
    );

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.messages[0].content).toBe("Plain content");
  });

  it("falls back to empty string when neither parts nor content", async () => {
    mockGetCurrentSession.mockResolvedValue(session);
    mockGetSubscriptionStatus.mockResolvedValue(subscription);
    mockCheckAIRateLimit.mockResolvedValue(happyRateLimit);
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => new Response("ok"),
    });

    await POST(makeRequest({ messages: [{ role: "user" }] }));

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.messages[0].content).toBe("");
  });
});
