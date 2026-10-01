"use client";

import { Bell, Check, Clock, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MockupProps } from "@/lib/features-config";

const notifications = [
  {
    icon: Check,
    iconBg: "bg-gradient-to-br from-success/10 to-success/15",
    iconRing: "ring-success/20",
    iconColor: "text-success",
    title: "System update completed",
    subtitle: "All services running normally",
    time: "2m",
    delay: 0,
  },
  {
    icon: UserPlus,
    iconBg: "bg-gradient-to-br from-blue-50 to-blue-100",
    iconRing: "ring-blue-200/50",
    iconColor: "text-blue-600",
    title: "New user registered",
    subtitle: "Sarah joined your workspace",
    time: "1h",
    delay: 150,
  },
  {
    icon: Clock,
    iconBg: "bg-gradient-to-br from-amber-50 to-amber-100",
    iconRing: "ring-amber-200/50",
    iconColor: "text-amber-600",
    title: "Backup scheduled",
    subtitle: "Daily backup at 2:00 AM",
    time: "3h",
    delay: 300,
  },
];

export function NotificationCardMockup({ className, isInView }: MockupProps) {
  return (
    <div
      className={cn(
        "w-full max-w-sm overflow-hidden rounded-xl",
        "bg-background/90 backdrop-blur-sm",
        "border-border/60 border",
        "shadow-muted/50 shadow-xl",
        className
      )}
    >
      {/* Header */}
      <div className="border-border from-muted/80 to-background flex items-center justify-between border-b bg-gradient-to-r px-5 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="animate-pulse-glow bg-success h-2 w-2 rounded-full" />
            <span className="text-muted-foreground text-xs font-medium tracking-wide">
              Live
            </span>
          </div>
          <div className="bg-muted h-4 w-px" />
          <span className="bg-success/10 text-success rounded-full px-2 py-0.5 text-xs font-medium">
            3 new
          </span>
        </div>
        <Bell className="text-muted-foreground h-4 w-4" />
      </div>

      {/* Content */}
      <div className="space-y-1 p-2">
        {notifications.map((notification, index) => {
          const Icon = notification.icon;
          const isLast = index === notifications.length - 1;

          return (
            <div
              key={index}
              className={cn(
                "flex items-start space-x-3 rounded-lg p-3",
                "transition-all duration-500 ease-out",
                "hover:bg-muted/80",
                isInView
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-4 opacity-0",
                !isLast && "border-border/50 border-b"
              )}
              style={{
                transitionDelay: isInView ? `${notification.delay}ms` : "0ms",
              }}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  "ring-1",
                  notification.iconBg,
                  notification.iconRing
                )}
              >
                <Icon className={cn("h-4 w-4", notification.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium tracking-tight">
                  {notification.title}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {notification.subtitle}
                </p>
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">
                {notification.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
