import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, MessageSquare, CreditCard, Zap } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session!.user.id))
    .limit(1);

  const isNativeTrialActive =
    !!subscription?.nativeTrialEndsAt &&
    subscription.nativeTrialEndsAt > new Date();

  const stats = [
    {
      title: "Projects",
      value: "3",
      description: "Active projects",
      icon: LayoutDashboard,
      tourId: "stat-projects",
    },
    {
      title: "Messages",
      value: "127",
      description: "AI conversations",
      icon: MessageSquare,
      tourId: "stat-messages",
    },
    {
      title: "Plan",
      value: subscription?.plan || "FREE",
      description: isNativeTrialActive ? "Trial active" : "Current plan",
      icon: CreditCard,
      tourId: "stat-plan",
    },
    {
      title: "API Calls",
      value: "1,234",
      description: "This month",
      icon: Zap,
      tourId: "stat-api",
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={`Welcome back, ${session!.user.name || "there"}!`}
        subtitle="Here's what's happening with your account."
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
              Start a new AI conversation, create a project, or manage your
              settings.
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
