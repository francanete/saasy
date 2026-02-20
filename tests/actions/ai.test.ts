import { vi, describe, it, expect, beforeEach } from "vitest";

// --- Mocks ---

const mockRequirePaidAccess = vi.fn();
vi.mock("@/lib/dal", () => ({
  requirePaidAccess: (...args: unknown[]) => mockRequirePaidAccess(...args),
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthError";
    }
  },
}));

const mockCheckAIRateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  checkAIRateLimit: (...args: unknown[]) => mockCheckAIRateLimit(...args),
}));

const mockGenerateText = vi.fn();
vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

const mockTrackAIUsage = vi.fn();
vi.mock("@/lib/ai-usage", () => ({
  trackAIUsage: (...args: unknown[]) => mockTrackAIUsage(...args),
}));

vi.mock("@/lib/ai", () => ({
  models: { flash: "flash-model", pro: "pro-model" },
}));

import { summarizeText, generateContent } from "@/actions/ai";
import { AuthError } from "@/lib/dal";

// --- Helpers ---

const happyRateLimit = {
  success: true,
  remaining: 5,
  resetAt: new Date(),
  limit: 10,
};

const happyGeneration = {
  text: "Generated text",
  usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
  finishReason: "stop",
};

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("summarizeText", () => {
  it("rejects input over 10,000 chars without auth check", async () => {
    const longText = "a".repeat(10_001);
    const result = await summarizeText(longText);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("10000");
    }
    expect(mockRequirePaidAccess).not.toHaveBeenCalled();
  });

  it("returns error when not authenticated", async () => {
    mockRequirePaidAccess.mockRejectedValue(new AuthError("Unauthorized"));

    const result = await summarizeText("some text");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
  });

  it("returns error with resetAt when rate limited", async () => {
    const resetAt = new Date("2026-03-01");
    mockRequirePaidAccess.mockResolvedValue({
      userId: "user-1",
      plan: "STARTER",
    });
    mockCheckAIRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      resetAt,
      limit: 10,
    });

    const result = await summarizeText("some text");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Rate limit");
      expect(result.resetAt).toEqual(resetAt);
    }
  });

  it("returns generic error when AI generation fails", async () => {
    mockRequirePaidAccess.mockResolvedValue({
      userId: "user-1",
      plan: "STARTER",
    });
    mockCheckAIRateLimit.mockResolvedValue(happyRateLimit);
    mockGenerateText.mockRejectedValue(new Error("AI broke"));

    const result = await summarizeText("some text");

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toBe("Failed to generate summary");
  });

  it("returns summary and tracks usage on success", async () => {
    mockRequirePaidAccess.mockResolvedValue({
      userId: "user-1",
      plan: "STARTER",
    });
    mockCheckAIRateLimit.mockResolvedValue(happyRateLimit);
    mockGenerateText.mockResolvedValue(happyGeneration);

    const result = await summarizeText("some text");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("Generated text");
    expect(mockTrackAIUsage).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", feature: "summarize" })
    );
  });
});

describe("generateContent", () => {
  it("rejects input over 10,000 chars", async () => {
    const result = await generateContent("a".repeat(10_001));

    expect(result.success).toBe(false);
    expect(mockRequirePaidAccess).not.toHaveBeenCalled();
  });

  it("returns error when not authenticated", async () => {
    mockRequirePaidAccess.mockRejectedValue(new AuthError("Unauthorized"));

    const result = await generateContent("prompt");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
  });

  it("returns error with resetAt when rate limited", async () => {
    const resetAt = new Date("2026-03-01");
    mockRequirePaidAccess.mockResolvedValue({
      userId: "user-1",
      plan: "STARTER",
    });
    mockCheckAIRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      resetAt,
      limit: 10,
    });

    const result = await generateContent("prompt");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Rate limit");
      expect(result.resetAt).toEqual(resetAt);
    }
  });

  it("returns content and tracks usage on success", async () => {
    mockRequirePaidAccess.mockResolvedValue({
      userId: "user-1",
      plan: "STARTER",
    });
    mockCheckAIRateLimit.mockResolvedValue(happyRateLimit);
    mockGenerateText.mockResolvedValue(happyGeneration);

    const result = await generateContent("prompt", "pro");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("Generated text");
    expect(mockTrackAIUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        model: "pro",
        feature: "generate",
      })
    );
  });
});
