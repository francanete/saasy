"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { appConfig, getGeneralCta } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { HeroDashboardMockup } from "./hero-dashboard-mockup";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useIntersectionObserver(ref, {
    threshold: 0.1,
    triggerOnce: true,
  });
  const generalCta = getGeneralCta();

  return (
    <section
      ref={ref}
      className={cn(
        "bg-background relative overflow-hidden",
        "flex min-h-[calc(100vh-4rem)] items-center",
        "py-16 md:py-20 lg:py-24",
        className
      )}
    >
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(#e2e8f0 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
            opacity: 0.4,
          }}
        />
        <div className="from-background to-background absolute inset-0 bg-gradient-to-b via-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left Column: Content */}
          <div
            className={cn(
              "max-w-2xl",
              "transition-all duration-1000 ease-out",
              isInView
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            )}
          >
            {/* Announcement Badge */}
            <div
              className={cn(
                "mb-8 inline-flex items-center gap-2 rounded-full",
                "border-border bg-muted border",
                "px-3 py-1 pr-4",
                "transition-all delay-100 duration-700",
                isInView ? "opacity-100" : "opacity-0"
              )}
            >
              <span className="bg-primary text-primary-foreground flex h-5 items-center rounded-full px-2 text-[10px] font-bold uppercase">
                New
              </span>
              <span className="text-muted-foreground text-sm font-medium">
                AI-powered development tools
              </span>
              <ChevronRight className="text-muted-foreground h-3 w-3" />
            </div>

            {/* Headline */}
            <h1 className="text-foreground mb-8 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Build Your SaaS <br />
              <span className="text-muted-foreground">Faster Than Ever</span>
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-muted-foreground mb-10 max-w-lg text-lg leading-relaxed md:text-xl",
                "transition-all delay-200 duration-700",
                isInView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              )}
            >
              A modern, production-ready boilerplate with authentication,
              payments, AI integration, and everything you need to launch your
              next project.
            </p>

            {/* CTAs */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-4",
                "transition-all delay-300 duration-700",
                isInView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              )}
            >
              <Button
                size="lg"
                asChild
                className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 h-12 rounded-full px-8 text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Link href={generalCta.href}>
                  {generalCta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="ghost"
                asChild
                className="text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-full px-8 text-base font-semibold"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div
              className={cn(
                "text-muted-foreground mt-12 flex items-center gap-6 text-sm font-medium",
                "transition-all delay-500 duration-700",
                isInView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              )}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                <span>
                  {!appConfig.pricing.requirePaidAccess
                    ? "Free plan available"
                    : appConfig.pricing.allowNativeTrial
                      ? `${appConfig.pricing.nativeTrialDays}-day free trial`
                      : "Paid plans only"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual */}
          <div
            className={cn(
              "relative flex items-center justify-center lg:justify-end",
              "transition-all delay-200 duration-1000 ease-out",
              isInView
                ? "translate-y-0 opacity-100"
                : "translate-y-16 opacity-0"
            )}
          >
            {/* Abstract Background Shapes */}
            <div className="bg-muted absolute -top-12 -right-12 h-[500px] w-[500px] rounded-full opacity-50 blur-3xl" />
            <div className="bg-muted absolute -bottom-12 -left-12 h-[400px] w-[400px] rounded-full opacity-50 blur-3xl" />

            <HeroDashboardMockup
              className="relative z-10"
              isInView={isInView}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
