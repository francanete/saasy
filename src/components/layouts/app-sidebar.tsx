"use client";

import Link from "next/link";
import { LayoutDashboard, MessageSquare, Settings, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { appConfig } from "@/lib/config";

type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "TRIALING"
  | "NONE";

interface AppSidebarProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  plan: "FREE" | "STARTER" | "GROWTH" | "SCALE";
  subscriptionStatus?: SubscriptionStatus;
  expiresAt?: Date | null;
  isAdmin?: boolean;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },

  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Tiers", href: "/dashboard/admin/tiers", icon: Shield },
];

export function AppSidebar({
  user,
  plan,
  subscriptionStatus,
  expiresAt,
  isAdmin,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
              <SidebarMenuButton size="lg" asChild className="flex-1">
                <Link
                  href="/"
                  className="group-data-[collapsible=icon]:justify-center"
                >
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg">
                    <span className="text-sm font-bold">
                      {appConfig.name.charAt(0)}
                    </span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">
                      {appConfig.name}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
              <SidebarTrigger className="shrink-0" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navigation} />
        {isAdmin && (
          <>
            <SidebarSeparator />
            <NavMain items={adminNavigation} label="Admin" />
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={user}
          plan={plan}
          subscriptionStatus={subscriptionStatus}
          expiresAt={expiresAt}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
