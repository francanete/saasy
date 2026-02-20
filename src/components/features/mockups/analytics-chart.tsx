"use client";

import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MockupProps } from "@/lib/features-config";

const barData = [
  { day: "Mon", height: 40, value: "$5,240" },
  { day: "Tue", height: 65, value: "$8,120" },
  { day: "Wed", height: 45, value: "$5,890" },
  { day: "Thu", height: 80, value: "$10,450" },
  { day: "Fri", height: 55, value: "$7,200" },
  { day: "Sat", height: 90, value: "$12,450", highlighted: true },
  { day: "Sun", height: 75, value: "$9,200" },
];

export function AnalyticsChartMockup({ className, isInView }: MockupProps) {
  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-xl p-6",
        "bg-background",
        "border-border border",
        "shadow-muted/50 shadow-xl",
        "ring-border ring-1",
        className
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide">
            Total Revenue
          </p>
          <div className="flex items-baseline space-x-3">
            <h3
              className={cn(
                "text-foreground text-3xl font-semibold tracking-tight",
                "transition-all duration-700 ease-out",
                isInView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              )}
            >
              $48,294
            </h3>
            <span
              className={cn(
                "bg-success/10 text-success flex items-center rounded-full px-2 py-1 text-xs font-medium",
                "transition-all delay-300 duration-500 ease-out",
                isInView ? "scale-100 opacity-100" : "scale-75 opacity-0"
              )}
            >
              <TrendingUp className="mr-1 h-3 w-3" />
              12.5%
            </span>
          </div>
        </div>
      </div>

      {/* Period Tabs */}
      <div
        className={cn(
          "mb-6 flex space-x-1",
          "transition-all delay-200 duration-500",
          isInView ? "opacity-100" : "opacity-0"
        )}
      >
        {["Week", "Month", "Year"].map((period, index) => (
          <button
            key={period}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              index === 0
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Horizontal Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-border border-t border-dashed" />
          ))}
        </div>

        {/* Chart Bars */}
        <div className="relative flex h-32 items-end justify-between space-x-2">
          {barData.map((bar, index) => {
            const isHighlighted = bar.highlighted;

            return (
              <div
                key={index}
                className="relative flex flex-1 flex-col items-center justify-end"
              >
                {/* Tooltip for highlighted bar */}
                {isHighlighted && (
                  <div
                    className={cn(
                      "absolute -top-10 left-1/2 z-10 -translate-x-1/2",
                      "bg-foreground text-background rounded-lg px-2.5 py-1.5 text-xs font-medium",
                      "shadow-lg",
                      "transition-all delay-700 duration-300",
                      isInView
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0"
                    )}
                  >
                    {bar.value}
                    {/* Arrow */}
                    <div className="bg-foreground absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45" />
                  </div>
                )}

                {/* Bar */}
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all ease-out",
                    isHighlighted
                      ? "from-success to-success/85 shadow-success/30 bg-gradient-to-t shadow-lg"
                      : "from-muted to-muted/70 bg-gradient-to-t"
                  )}
                  style={{
                    height: isInView ? `${bar.height}%` : "0%",
                    transitionDuration: "800ms",
                    transitionDelay: `${index * 80}ms`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div
        className={cn(
          "text-muted-foreground mt-3 flex justify-between text-xs",
          "transition-all delay-500 duration-500",
          isInView ? "opacity-100" : "opacity-0"
        )}
      >
        {barData.map((bar) => (
          <span
            key={bar.day}
            className={cn(
              "flex-1 text-center",
              bar.highlighted && "text-foreground font-medium"
            )}
          >
            {bar.day}
          </span>
        ))}
      </div>

      {/* Comparison Text */}
      <p
        className={cn(
          "text-muted-foreground mt-4 text-center text-xs",
          "transition-all delay-600 duration-500",
          isInView ? "opacity-100" : "opacity-0"
        )}
      >
        vs last week
      </p>
    </div>
  );
}
