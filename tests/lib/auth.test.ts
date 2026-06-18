import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindFirst,
  mockInsert,
  mockValues,
  mockOnConflictDoUpdate,
  mockInngestSend,
  mockAppConfig,
} = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockInsert: vi.fn(),
  mockValues: vi.fn(),
  mockOnConflictDoUpdate: vi.fn(),
  mockInngestSend: vi.fn(),
  mockAppConfig: {
    name: "Test App",
    pricing: {
      allowNativeTrial: true,
      nativeTrialDays: 7,
    },
  },
}));

mockOnConflictDoUpdate.mockResolvedValue(undefined);
mockValues.mockReturnValue({
  onConflictDoUpdate: mockOnConflictDoUpdate,
  onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
});
mockInsert.mockReturnValue({ values: mockValues });

vi.mock("better-auth", () => ({
  betterAuth: vi.fn((config) => config),
}));

vi.mock("better-auth/api", () => ({
  createAuthMiddleware: vi.fn((handler) => handler),
}));

vi.mock("better-auth/plugins/magic-link", () => ({
  magicLink: vi.fn((config) => config),
}));

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));

vi.mock("@polar-sh/better-auth", () => ({
  polar: vi.fn((config) => config),
  checkout: vi.fn((config) => config),
  portal: vi.fn(() => ({})),
  webhooks: vi.fn((config) => config),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      subscriptions: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
  },
  users: {
    id: "id",
    email: "email",
    name: "name",
  },
  subscriptions: {
    userId: "userId",
  },
}));

vi.mock("@/lib/db/schema", () => ({}));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/config", () => ({
  appConfig: mockAppConfig,
  getPlanFromPolarProduct: vi.fn(),
}));
vi.mock("@/lib/pricing", () => ({ getPolarProducts: vi.fn(() => []) }));
vi.mock("@/lib/subscription", () => ({
  upsertSubscription: vi.fn(),
  updateSubscriptionStatus: vi.fn(),
  mapPolarStatus: vi.fn(),
}));
vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    send: (...args: unknown[]) => mockInngestSend(...args),
  },
}));
vi.mock("@/lib/openpanel", () => ({
  trackEvent: vi.fn(),
  trackRevenue: vi.fn(),
}));
vi.mock("@/lib/polar-client", () => ({
  polarClient: {
    customers: {
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";

const runAfterHook = auth as unknown as {
  hooks: { after: (ctx: { path: string; context: unknown }) => Promise<void> };
};

describe("auth native trial grant hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppConfig.pricing.allowNativeTrial = true;
    mockAppConfig.pricing.nativeTrialDays = 7;

    mockOnConflictDoUpdate.mockResolvedValue(undefined);
    mockValues.mockReturnValue({
      onConflictDoUpdate: mockOnConflictDoUpdate,
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    });
    mockInsert.mockReturnValue({ values: mockValues });
    mockFindFirst.mockResolvedValue(undefined);
    mockInngestSend.mockResolvedValue(undefined);
  });

  it("grants a STARTER native trial for a new signup", async () => {
    await runAfterHook.hooks.after({
      path: "/sign-up/email",
      context: {
        newSession: {
          user: { id: "user-1", email: "user@example.com" },
        },
      },
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        plan: "STARTER",
        billingType: "none",
        status: "ACTIVE",
        nativeTrialStartedAt: expect.any(Date),
        nativeTrialEndsAt: expect.any(Date),
      })
    );
    expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    expect(mockInngestSend).toHaveBeenCalledWith({
      name: "user/created",
      data: {
        userId: "user-1",
        email: "user@example.com",
      },
    });
  });

  it("does not grant a native trial when disabled", async () => {
    mockAppConfig.pricing.allowNativeTrial = false;

    await runAfterHook.hooks.after({
      path: "/sign-up/email",
      context: {
        newSession: {
          user: { id: "user-1", email: "user@example.com" },
        },
      },
    });

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockInngestSend).toHaveBeenCalledWith({
      name: "user/created",
      data: {
        userId: "user-1",
        email: "user@example.com",
      },
    });
  });

  it("does not reset a user who already has a native trial", async () => {
    mockFindFirst.mockResolvedValue({
      plan: "STARTER",
      nativeTrialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await runAfterHook.hooks.after({
      path: "/magic-link/verify",
      context: {
        newSession: {
          user: { id: "user-1", email: "user@example.com" },
        },
      },
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("does not overwrite a paid user", async () => {
    mockFindFirst.mockResolvedValue({
      plan: "GROWTH",
      nativeTrialEndsAt: null,
    });

    await runAfterHook.hooks.after({
      path: "/callback/google",
      context: {
        newSession: {
          user: { id: "user-1", email: "user@example.com" },
        },
      },
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("ignores non-signup paths", async () => {
    await runAfterHook.hooks.after({
      path: "/sign-in/email",
      context: {
        newSession: {
          user: { id: "user-1", email: "user@example.com" },
        },
      },
    });

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockInngestSend).not.toHaveBeenCalled();
  });
});
