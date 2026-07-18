import { vi, describe, it, expect, beforeEach } from "vitest";

const mockSelect = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
  users: { id: "id", email: "email", name: "name" },
  subscriptions: {
    userId: "userId",
    plan: "plan",
    nativeTrialEndsAt: "nativeTrialEndsAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ op: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
  gte: vi.fn((a, b) => ({ op: "gte", a, b })),
  lt: vi.fn((a, b) => ({ op: "lt", a, b })),
  inArray: vi.fn((a, b) => ({ op: "inArray", a, b })),
}));

const mockSendTransactionalEmail = vi.fn();
vi.mock("@/lib/email-sequences", () => ({
  sendTransactionalEmail: (...args: unknown[]) =>
    mockSendTransactionalEmail(...args),
}));

vi.mock("@/lib/config", () => ({
  appConfig: {
    pricing: {
      tiers: {
        STARTER: {
          marketing: { name: "Starter" },
        },
      },
    },
  },
}));

vi.mock("../helpers", () => ({
  BATCH_SIZE: 2,
  DELAY_BETWEEN_USERS_MS: 0,
  DELAY_BETWEEN_BATCHES_MS: 0,
  chunkArray: (arr: unknown[], size: number) => {
    const out: unknown[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  },
  delay: vi.fn().mockResolvedValue(undefined),
  formatDate: vi.fn((date: Date) => date.toISOString()),
}));

import {
  trialEndingReminderHandler,
  type InngestStepLike,
} from "@/lib/inngest/jobs/trial-ending-reminder";

beforeEach(() => {
  vi.clearAllMocks();
  mockSendTransactionalEmail.mockResolvedValue({ sent: true });
});

describe("trialEndingReminderHandler", () => {
  it("uses nativeTrialEndsAt and sends reminder emails", async () => {
    const trials = [
      {
        userId: "user-1",
        plan: "STARTER",
        nativeTrialEndsAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
      },
    ];

    const selectChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(trials),
      }),
    };

    mockSelect.mockReturnValue(selectChain);

    const userSelectChain = {
      from: vi.fn().mockReturnValue({
        where: vi
          .fn()
          .mockResolvedValue([
            { id: "user-1", email: "test@example.com", name: "Test User" },
          ]),
      }),
    };

    mockSelect
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(userSelectChain);

    const step: InngestStepLike = {
      run: async <T>(_name: string, fn: () => Promise<T>) => fn(),
      sleep: vi.fn(),
    };

    const result = await trialEndingReminderHandler(step);

    expect(result.total).toBe(1);
    expect(mockSendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        email: "test@example.com",
        emailKey: "trial_ending_24h",
      })
    );
  });
});
