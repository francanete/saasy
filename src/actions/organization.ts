"use server";

import { eq } from "drizzle-orm";
import {
  db,
  invitations,
  members,
  organizations,
  sessions,
  subscriptions,
} from "@/lib/db";
import { getCurrentSession } from "@/lib/dal";
import {
  getOrganizationForUser,
  getPendingInvitationForEmail,
} from "@/lib/organization";
import {
  getPolarRecoveryBlockReason,
  getRecoveryBlockReason,
  getRecoveryBlockReasonFromState,
} from "@/lib/organization-recovery";

type RecoveryResult =
  | { success: true; organizationId: string }
  | { success: false; error: string };

class RecoveryBlocked extends Error {}

/** Replace an empty trial-only organization with a matching invitation. */
export async function joinInvitedOrganization(
  invitationId: string
): Promise<RecoveryResult> {
  const session = await getCurrentSession();
  if (!session)
    return { success: false, error: "Sign in to accept the invitation." };

  const invitation = await getPendingInvitationForEmail(
    invitationId,
    session.user.email
  );
  if (!invitation || !["admin", "member"].includes(invitation.role || "")) {
    return { success: false, error: "This invitation is no longer available." };
  }

  const current = await getOrganizationForUser(session.user.id);
  if (!current || current.id === invitation.organizationId) {
    return {
      success: false,
      error: "Your organization membership has changed. Refresh the page.",
    };
  }

  const localBlock = await getRecoveryBlockReason(current, session.user.id);
  if (localBlock) return { success: false, error: localBlock };

  const polarBlock = await getPolarRecoveryBlockReason(session.user.email);
  if (polarBlock) return { success: false, error: polarBlock };

  try {
    await db.transaction(async (tx) => {
      // Lock both rows so another membership or invitation write cannot pass
      // the checks while the old organization is being removed.
      const [oldOrganization] = await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, current.id))
        .for("update");
      const [lockedInvitation] = await tx
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .for("update");
      const [targetOrganization] = await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, invitation.organizationId))
        .for("update");
      if (!oldOrganization || !lockedInvitation || !targetOrganization) {
        throw new RecoveryBlocked(
          "The organization or invitation has changed."
        );
      }
      if (
        lockedInvitation.organizationId !== invitation.organizationId ||
        lockedInvitation.email.toLowerCase() !==
          session.user.email.toLowerCase() ||
        lockedInvitation.status !== "pending" ||
        lockedInvitation.expiresAt <= new Date() ||
        !["admin", "member"].includes(lockedInvitation.role || "")
      ) {
        throw new RecoveryBlocked("This invitation is no longer available.");
      }

      const memberRows = await tx
        .select({ userId: members.userId, role: members.role })
        .from(members)
        .where(eq(members.organizationId, current.id))
        .limit(2);
      const invitationRows = await tx
        .select({ id: invitations.id })
        .from(invitations)
        .where(eq(invitations.organizationId, current.id))
        .limit(1);
      const subscriptionRows = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.organizationId, current.id))
        .limit(1);
      const targetMembers = await tx
        .select({ id: members.id })
        .from(members)
        .where(eq(members.organizationId, invitation.organizationId))
        .limit(100);

      const block = getRecoveryBlockReasonFromState({
        role: memberRows[0]?.role === "owner" ? "owner" : "member",
        userId: session.user.id,
        memberUserIds: memberRows.map((member) => member.userId),
        invitationCount: invitationRows.length,
        subscription: subscriptionRows[0],
      });
      if (block) throw new RecoveryBlocked(block);
      if (targetMembers.length >= 100) {
        throw new RecoveryBlocked("The invited organization is full.");
      }

      await tx.delete(organizations).where(eq(organizations.id, current.id));
      await tx.insert(members).values({
        organizationId: invitation.organizationId,
        userId: session.user.id,
        role: lockedInvitation.role || "member",
      });
      await tx
        .update(invitations)
        .set({ status: "accepted" })
        .where(eq(invitations.id, invitationId));
      await tx
        .update(sessions)
        .set({ activeOrganizationId: invitation.organizationId })
        .where(eq(sessions.userId, session.user.id));
    });
  } catch (error) {
    if (error instanceof RecoveryBlocked) {
      return { success: false, error: error.message };
    }
    console.error("Organization recovery failed:", error);
    return {
      success: false,
      error: "Could not switch organizations. Nothing was changed.",
    };
  }

  return { success: true, organizationId: invitation.organizationId };
}
