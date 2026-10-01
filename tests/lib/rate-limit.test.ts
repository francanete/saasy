import { vi, describe, it, expect, beforeEach } from "vitest";

// --- Mocks ---

const mockSelect = vi.fn();
vi.mock("@/lib/db", () => ({
  db: { select: (...args: unknown[]) => mockSelect(...args) },
}));

vi.mock("@/lib/db/schema", () => ({
  aiUsage: { userId: "userId", createdAt: "createdAt" },
}));

vi.mock("@/lib/config", () => ({
  appConfig: {
    pricing: {
      rateLimits: {
        FREE: { chat: { requestsPerDay: 5 } },
        STARTER: {
          chat: { requestsPerDay: 50 },
          summarize: { requestsPerDay: 20 },
        },
        // SCALE has no config -> unlimited
      },
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  gte: vi.fn(),
  sql: vi.fn(),
  and: vi.fn(),
}));

import { checkAIRateLimit } from "@/lib/rate-limit";

// --- Helpers ---

function setupDbCount(count: number) {
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count }]),
    }),
  });
}

function setupDbError() {
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error("DB down")),
    }),
  });
}

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("checkAIRateLimit", () => {
  it("returns unlimited when plan has no config", async () => {
    const result = await checkAIRateLimit("user-1", "SCALE");

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(Infinity);
    expect(result.limit).toBe(Infinity);
  });

  it("returns unlimited when feature has no config for plan", async () => {
    const result = await checkAIRateLimit("user-1", "FREE", "summarize");

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it("allows when count is below limit", async () => {
    setupDbCount(2);

    const result = await checkAIRateLimit("user-1", "FREE", "chat");

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2); // 5 - 2 - 1
    expect(result.limit).toBe(5);
  });

  it("denies when count equals limit", async () => {
    setupDbCount(5);

    const result = await checkAIRateLimit("user-1", "FREE", "chat");

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("denies when count exceeds limit", async () => {
    setupDbCount(10);

    const result = await checkAIRateLimit("user-1", "FREE", "chat");

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns remaining 0 on last allowed request", async () => {
    setupDbCount(4); // limit is 5, count is 4 -> remaining = 5-4-1 = 0

    const result = await checkAIRateLimit("user-1", "FREE", "chat");

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("fails closed on DB error", async () => {
    setupDbError();

    const result = await checkAIRateLimit("user-1", "FREE", "chat");

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(0);
  });

  it("resetAt is tomorrow midnight UTC", async () => {
    setupDbCount(0);

    const result = await checkAIRateLimit("user-1", "FREE", "chat");

    const tomorrow = new Date();
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    expect(result.resetAt.getTime()).toBe(tomorrow.getTime());
  });
});
