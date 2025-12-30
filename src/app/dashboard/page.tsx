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

  const stats = [
    {
      title: "Projects",
      value: "3",
      description: "Active projects",
      icon: LayoutDashboard,
    },
    {
      title: "Messages",
      value: "127",
      description: "AI conversations",
      icon: MessageSquare,
    },
    {
      title: "Plan",
      value: subscription?.plan || "FREE",
      description:
        subscription?.status === "TRIALING" ? "Trial active" : "Current plan",
      icon: CreditCard,
    },
    {
      title: "API Calls",
      value: "1,234",
      description: "This month",
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session!.user.name || "there"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">
              No recent activity to show.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
