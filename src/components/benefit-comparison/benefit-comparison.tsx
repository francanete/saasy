"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import {
  benefitComparisonConfig,
  type ComparisonItem,
} from "@/lib/benefit-comparison-config";

interface BenefitComparisonProps {
  className?: string;
}

export function BenefitComparison({ className }: BenefitComparisonProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useIntersectionObserver(ref, {
    threshold: 0.1,
    triggerOnce: true,
  });

  const { header, oldWay, modernApproach } = benefitComparisonConfig;

  return (
    <section
      ref={ref}
      className={cn(
        "from-background to-muted bg-gradient-to-b py-24 lg:py-32",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={cn(
            "mb-20 max-w-2xl",
            "transition-all duration-700 ease-out",
            isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
        >
          <h2 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            {header.title}
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            {header.subtitle}
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {/* Old Way Card */}
          <div
            className={cn(
              "relative",
              "transition-all delay-100 duration-700 ease-out",
              isInView
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            )}
          >
            <div className="from-muted to-muted/50 absolute -inset-px rounded-2xl bg-gradient-to-b" />
            <div className="bg-background relative rounded-2xl p-8 lg:p-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                  <X
                    className="text-muted-foreground h-5 w-5"
                    strokeWidth={2.5}
                  />
                </div>
                <h3 className="text-foreground text-lg font-semibold">
                  {oldWay.label}
                </h3>
              </div>

              <ul className="space-y-6">
                {oldWay.items.map((item, index) => (
                  <OldWayItem
                    key={item.title}
                    item={item}
                    isInView={isInView}
                    delay={index * 75}
                  />
                ))}
              </ul>
            </div>
          </div>

          {/* Modern Approach Card */}
          <div
            className={cn(
              "relative",
              "transition-all delay-200 duration-700 ease-out",
              isInView
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            )}
          >
            <div className="from-success/20 to-success/5 absolute -inset-px rounded-2xl bg-gradient-to-b" />
            <div className="bg-background shadow-success/10 relative rounded-2xl p-8 shadow-lg lg:p-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="bg-success flex h-10 w-10 items-center justify-center rounded-lg">
                  <Check
                    className="text-primary-foreground h-5 w-5"
                    strokeWidth={2.5}
                  />
                </div>
                <h3 className="text-foreground text-lg font-semibold">
                  {modernApproach.label}
                </h3>
              </div>

              <ul className="space-y-6">
                {modernApproach.items.map((item, index) => (
                  <ModernApproachItem
                    key={item.title}
                    item={item}
                    isInView={isInView}
                    delay={index * 75}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ItemProps {
  item: ComparisonItem;
  isInView: boolean;
  delay: number;
}

function OldWayItem({ item, isInView, delay }: ItemProps) {
  return (
    <li
      className={cn(
        "flex gap-4",
        "transition-all duration-500 ease-out",
        isInView ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
      )}
      style={{ transitionDelay: isInView ? `${300 + delay}ms` : "0ms" }}
    >
      <div className="mt-0.5 flex-shrink-0">
        <div className="bg-muted-foreground h-1.5 w-1.5 rounded-full" />
      </div>
      <div>
        <p className="text-foreground text-[15px] leading-snug font-medium">
          {item.title}
        </p>
        <p className="text-muted-foreground mt-1.5 text-[15px] leading-relaxed">
          {item.description}
        </p>
      </div>
    </li>
  );
}

function ModernApproachItem({ item, isInView, delay }: ItemProps) {
  return (
    <li
      className={cn(
        "flex gap-4",
        "transition-all duration-500 ease-out",
        isInView ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
      )}
      style={{ transitionDelay: isInView ? `${400 + delay}ms` : "0ms" }}
    >
      <div className="mt-0.5 flex-shrink-0">
        <Check className="text-success h-5 w-5" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-foreground text-[15px] leading-snug font-medium">
          {item.title}
        </p>
        <p className="text-muted-foreground mt-1.5 text-[15px] leading-relaxed">
          {item.description}
        </p>
      </div>
    </li>
  );
}
