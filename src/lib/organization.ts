import { and, eq, gt, sql } from "drizzle-orm";
import {
  db,
  invitations,
  members,
  organizations,
  type OrganizationRole,
} from "@/lib/db";

export type OrganizationContext = {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
};

export async function getOrganizationForUser(
  userId: string
): Promise<OrganizationContext | null> {
  const membership = await db.query.members.findFirst({
    where: eq(members.userId, userId),
    with: { organization: true },
  });

  if (!membership) return null;

  return {
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role as OrganizationRole,
  };
}

export function canManageOrganization(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageBilling(role: OrganizationRole): boolean {
  return role === "owner";
}

export async function getPendingInvitationsForEmail(email: string) {
  return db
    .select({
      id: invitations.id,
      organizationId: invitations.organizationId,
      organizationName: organizations.name,
      role: invitations.role,
    })
    .from(invitations)
    .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
    .where(
      and(
        sql`lower(${invitations.email}) = ${email.toLowerCase()}`,
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date())
      )
    );
}

export async function getPendingInvitationForEmail(id: string, email: string) {
  const [invitation] = await db
    .select({
      id: invitations.id,
      organizationId: invitations.organizationId,
      organizationName: organizations.name,
      role: invitations.role,
    })
    .from(invitations)
    .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
    .where(
      and(
        eq(invitations.id, id),
        sql`lower(${invitations.email}) = ${email.toLowerCase()}`,
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date())
      )
    )
    .limit(1);
  return invitation ?? null;
}
