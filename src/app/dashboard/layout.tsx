import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSubscriptionStatus } from "@/lib/subscription";
import { isUserAdmin } from "@/lib/dal";
import { TrialBanner } from "@/components/trial-banner";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { CheckoutSuccessToast } from "@/components/checkout-success-toast";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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

  // Get subscription status and admin status
  const [subscription, isAdmin] = await Promise.all([
    getSubscriptionStatus(session.user.id),
    isUserAdmin(session.user.id),
  ]);

  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <CheckoutSuccessToast />
      </Suspense>
      <AppSidebar
        user={session.user}
        plan={subscription.plan}
        subscriptionStatus={subscription.status}
        expiresAt={subscription.expiresAt}
        isAdmin={isAdmin}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <span className="text-muted-foreground text-sm">Dashboard</span>
        </header>
        {subscription.status === "TRIALING" && subscription.expiresAt && (
          <TrialBanner endsAt={subscription.expiresAt} />
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
