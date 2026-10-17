import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, invitations, members, users } from "@/lib/db";
import { getCurrentSession } from "@/lib/dal";
import { getOrganizationForUser } from "@/lib/organization";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { OrganizationManagement } from "./organization-management";

export default async function OrganizationPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const organization = await getOrganizationForUser(session.user.id);
  if (!organization) redirect("/organizations/new");

  const [memberRows, invitationRows] = await Promise.all([
    db
      .select({
        id: members.id,
        userId: members.userId,
        role: members.role,
        name: users.name,
        email: users.email,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.organizationId, organization.id)),
    db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
      })
      .from(invitations)
      .where(eq(invitations.organizationId, organization.id)),
  ]);

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={organization.name}
        subtitle="Manage who can access this organization's dashboard."
      />
      <OrganizationManagement
        organizationId={organization.id}
        currentUserId={session.user.id}
        role={organization.role}
        members={memberRows}
        invitations={invitationRows.filter((item) => item.status === "pending")}
      />
    </div>
  );
}
