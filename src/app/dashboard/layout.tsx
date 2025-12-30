import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { TrialBanner } from "@/components/trial-banner";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { CheckoutSuccessToast } from "@/components/checkout-success-toast";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Get subscription status
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  // For now, allow access even without subscription (FREE tier)
  // Uncomment below to require subscription:
  // const hasAccess = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
  // if (!hasAccess) {
  //   redirect("/pricing?reason=no_subscription");
  // }

  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <CheckoutSuccessToast />
      </Suspense>
      <AppSidebar user={session.user} plan={subscription?.plan || "FREE"} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm text-muted-foreground">Dashboard</span>
        </header>
        {subscription?.status === "TRIALING" &&
          subscription.currentPeriodEnd && (
            <TrialBanner endsAt={subscription.currentPeriodEnd} />
          )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
