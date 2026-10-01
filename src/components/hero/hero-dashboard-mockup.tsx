"use client";

import { TrendingUp, Users, CreditCard, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroDashboardMockupProps {
  className?: string;
  isInView?: boolean;
}

const weekData = [
  { height: 45 },
  { height: 62 },
  { height: 55 },
  { height: 78 },
  { height: 60 },
  { height: 88 },
  { height: 72 },
];

const activityItems = [
  {
    icon: Users,
    text: "New enterprise team joined",
    time: "2m ago",
    amount: "+$2,400",
    delay: 400,
  },
  {
    icon: CreditCard,
    text: "Subscription renewed",
    time: "15m ago",
    amount: "+$890",
    delay: 500,
  },
  {
    icon: Activity,
    text: "Server capacity upgraded",
    time: "1h ago",
    amount: "-$120",
    delay: 600,
  },
];

export function HeroDashboardMockup({
  className,
  isInView = true,
}: HeroDashboardMockupProps) {
  return (
    <div
      className={cn(
        "relative w-full max-w-[500px]",
        "rounded-xl",
        "bg-background",
        "border-border border",
        "shadow-muted/50 shadow-2xl",
        "overflow-hidden",
        className
      )}
    >
      {/* Header - Minimalist */}
      <div className="border-border bg-background flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="bg-muted h-2.5 w-2.5 rounded-full" />
            <div className="bg-muted h-2.5 w-2.5 rounded-full" />
            <div className="bg-muted h-2.5 w-2.5 rounded-full" />
          </div>
        </div>
        <div className="border-border bg-muted flex items-center gap-2 rounded-full border px-2 py-1">
          <div className="bg-success h-1.5 w-1.5 rounded-full" />
          <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
            System Operational
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Main Metric */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">
              Total Revenue
            </p>
            <span
              className={cn(
                "bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                "transition-all delay-200 duration-500 ease-out",
                isInView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              )}
            >
              <TrendingUp className="h-3 w-3" />
              +12.5%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-muted-foreground text-3xl font-light tracking-tight">
              $
            </span>
            <span
              className={cn(
                "text-foreground text-4xl font-semibold tracking-tight",
                "transition-all duration-700 ease-out",
                isInView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              )}
            >
              48,352.00
            </span>
          </div>
        </div>

        {/* Chart - Clean & Professional */}
        <div
          className={cn(
            "mb-8",
            "transition-all delay-100 duration-700",
            isInView ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex h-24 items-end justify-between gap-2 md:gap-4">
            {weekData.map((bar, index) => (
              <div
                key={index}
                className="group flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className="bg-foreground w-full rounded-sm opacity-90 transition-all hover:opacity-100"
                  style={{
                    height: isInView ? `${bar.height}%` : "0%",
                    transition: "height 1000ms cubic-bezier(0.4, 0, 0.2, 1)",
                    transitionDelay: `${200 + index * 50}ms`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="border-border mt-3 flex justify-between border-t pt-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <span
                key={i}
                className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase"
              >
                {day}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Transactions - Minimal List */}
        <div>
          <p className="text-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
            Recent Transactions
          </p>
          <div className="space-y-3">
            {activityItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between py-2",
                    "border-muted border-b last:border-0",
                    "transition-all duration-500 ease-out",
                    isInView
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-4 opacity-0"
                  )}
                  style={{
                    transitionDelay: isInView ? `${item.delay}ms` : "0ms",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="border-border bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-foreground text-sm font-medium">
                        {item.text}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {item.time}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      item.amount.startsWith("+")
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.amount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
