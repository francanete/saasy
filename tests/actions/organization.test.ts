import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSession = vi.fn();
const mockInvitation = vi.fn();
const mockOrganization = vi.fn();
const mockLocalBlock = vi.fn();
const mockPolarBlock = vi.fn();
const mockStateBlock = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/dal", () => ({ getCurrentSession: () => mockSession() }));
vi.mock("@/lib/organization", () => ({
  getOrganizationForUser: (...args: unknown[]) => mockOrganization(...args),
  getPendingInvitationForEmail: (...args: unknown[]) => mockInvitation(...args),
}));
vi.mock("@/lib/organization-recovery", () => ({
  getRecoveryBlockReason: (...args: unknown[]) => mockLocalBlock(...args),
  getPolarRecoveryBlockReason: (...args: unknown[]) => mockPolarBlock(...args),
  getRecoveryBlockReasonFromState: (...args: unknown[]) =>
    mockStateBlock(...args),
}));
vi.mock("drizzle-orm", () => ({
  eq: (field: string, value: string) => ({ field, value }),
}));
vi.mock("@/lib/db", () => ({
  db: { transaction: (...args: unknown[]) => mockTransaction(...args) },
  organizations: { id: "organizations.id", name: "organizations" },
  invitations: {
    id: "invitations.id",
    organizationId: "invitations.organizationId",
    status: "invitations.status",
  },
  members: {
    id: "members.id",
    organizationId: "members.organizationId",
    userId: "members.userId",
    role: "members.role",
  },
  subscriptions: { organizationId: "subscriptions.organizationId" },
  sessions: { userId: "sessions.userId" },
}));

import { joinInvitedOrganization } from "@/actions/organization";
import { organizations, members } from "@/lib/db";

const current = {
  id: "old-org",
  name: "Accidental",
  slug: "accidental",
  role: "owner",
};
const invitation = {
  id: "invite-1",
  organizationId: "target-org",
  role: "member",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue({
    user: { id: "user-1", email: "user@example.com" },
  });
  mockInvitation.mockResolvedValue(invitation);
  mockOrganization.mockResolvedValue(current);
  mockLocalBlock.mockResolvedValue(null);
  mockPolarBlock.mockResolvedValue(null);
  mockStateBlock.mockReturnValue(null);
});

describe("joinInvitedOrganization", () => {
  it("refuses an invitation that is not available to the signed-in email", async () => {
    mockInvitation.mockResolvedValue(null);
    expect((await joinInvitedOrganization("invite-1")).success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockInvitation).toHaveBeenCalledWith("invite-1", "user@example.com");
  });

  it("never starts the switch if the old organization has billing", async () => {
    mockLocalBlock.mockResolvedValue("This organization has billing.");
    expect(await joinInvitedOrganization("invite-1")).toEqual({
      success: false,
      error: "This organization has billing.",
    });
    expect(mockPolarBlock).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("fails closed when Polar reports a purchase", async () => {
    mockPolarBlock.mockResolvedValue("A Polar purchase exists.");
    expect((await joinInvitedOrganization("invite-1")).success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("swaps the empty organization and invitation in one transaction", async () => {
    const deleted: unknown[] = [];
    const inserted: Array<{
      organizationId: string;
      userId: string;
      role: string;
    }> = [];
    const tx = {
      select: () => ({
        from: (table: unknown) => ({
          where: (condition: { value: string }) => ({
            for: async () => {
              if (table === organizations) return [{ id: condition.value }];
              return [
                {
                  id: "invite-1",
                  organizationId: "target-org",
                  email: "user@example.com",
                  status: "pending",
                  expiresAt: new Date(Date.now() + 60_000),
                  role: "member",
                },
              ];
            },
            limit: async () => {
              if (table === members && condition.value === "old-org")
                return [{ userId: "user-1", role: "owner" }];
              if (table === members) return [{ id: "target-owner" }];
              return [];
            },
          }),
        }),
      }),
      delete: (table: unknown) => ({
        where: async () => {
          deleted.push(table);
        },
      }),
      insert: () => ({
        values: async (value: {
          organizationId: string;
          userId: string;
          role: string;
        }) => {
          inserted.push(value);
        },
      }),
      update: () => ({ set: () => ({ where: async () => {} }) }),
    };
    mockTransaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<void>) =>
        callback(tx)
    );

    expect(await joinInvitedOrganization("invite-1")).toEqual({
      success: true,
      organizationId: "target-org",
    });
    expect(deleted).toEqual([organizations]);
    expect(inserted).toEqual([
      { organizationId: "target-org", userId: "user-1", role: "member" },
    ]);
    expect(mockStateBlock).toHaveBeenCalledWith(
      expect.objectContaining({ memberUserIds: ["user-1"], invitationCount: 0 })
    );
  });
});
