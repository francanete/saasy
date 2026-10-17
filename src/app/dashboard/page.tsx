import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db, members } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getOrganizationForUser } from "@/lib/organization";
import { getOrganizationSubscriptionStatus } from "@/lib/subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, Shield } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");
  const organization = await getOrganizationForUser(session.user.id);
  if (!organization) redirect("/organizations/new");
  const [subscription, memberRows] = await Promise.all([
    getOrganizationSubscriptionStatus(organization.id),
    db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.organizationId, organization.id)),
  ]);

  const stats = [
    {
      title: "Organization",
      value: organization.name,
      description: "Shared workspace",
      icon: Building2,
      tourId: "stat-organization",
    },
    {
      title: "Members",
      value: String(memberRows.length),
      description: "People with access",
      icon: Users,
      tourId: "stat-members",
    },
    {
      title: "Plan",
      value: subscription.plan,
      description: subscription.isNativeTrialActive
        ? "Trial active"
        : "Organization plan",
      icon: CreditCard,
      tourId: "stat-plan",
    },
    {
      title: "Your role",
      value: organization.role,
      description: "Organization access",
      icon: Shield,
      tourId: "stat-role",
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={`Welcome back, ${session.user.name || "there"}!`}
        subtitle={`Here's what's happening in ${organization.name}.`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} id={`tour-${stat.tourId}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground text-xs">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card id="tour-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Visit{" "}
              <Link className="underline" href="/dashboard/organization">
                Organization
              </Link>{" "}
              to manage members, or open Settings to review your plan.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No recent activity to show.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
