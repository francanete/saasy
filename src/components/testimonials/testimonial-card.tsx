"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { type TestimonialDefinition } from "@/lib/testimonials-config";

interface TestimonialCardProps {
  testimonial: TestimonialDefinition;
  isInView: boolean;
  delay?: number;
}

export function TestimonialCard({
  testimonial,
  isInView,
  delay = 0,
}: TestimonialCardProps) {
  const { author, role, company, quote, initials, featured, stats } =
    testimonial;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl p-8 transition-all duration-500",
        featured
          ? "from-foreground to-foreground/90 text-primary-foreground bg-gradient-to-br shadow-xl lg:col-span-2"
          : "border-border/60 bg-background/80 border shadow-sm hover:-translate-y-1 hover:shadow-lg",
        isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
      style={{ transitionDelay: isInView ? `${delay}ms` : "0ms" }}
    >
      {/* Quote Icon */}
      <div className="relative z-10 mb-6">
        <QuoteIcon
          className={cn(
            "h-6 w-6",
            featured ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>

      {/* Quote Content */}
      <blockquote className="relative z-10 mb-8 flex-grow">
        <p
          className={cn(
            "leading-relaxed font-medium tracking-tight",
            featured
              ? "text-primary-foreground/90 text-xl md:text-2xl"
              : "text-foreground text-lg"
          )}
        >
          &ldquo;{quote}&rdquo;
        </p>
      </blockquote>

      {/* Stats Badge */}
      {stats && (
        <div
          className={cn(
            "absolute top-8 right-8 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
            featured
              ? "border-primary/30 bg-primary/20 text-primary/70 border"
              : "border-primary/20 bg-primary/10 text-primary border"
          )}
        >
          {stats}
        </div>
      )}

      {/* Author Info */}
      <div className="border-border/10 relative z-10 mt-auto flex items-center border-t pt-6">
        {/* Avatar */}
        <div
          className={cn(
            "mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-inner",
            featured
              ? "from-primary text-primary-foreground ring-background/10 bg-gradient-to-br to-purple-500 ring-2"
              : "from-muted to-muted/70 text-muted-foreground ring-border bg-gradient-to-br ring-1"
          )}
        >
          {initials}
        </div>

        <div>
          <div
            className={cn(
              "flex items-center gap-2 font-bold",
              featured ? "text-primary-foreground" : "text-foreground"
            )}
          >
            {author}
            <VerifiedIcon
              className={cn(
                "h-4 w-4",
                featured ? "text-primary" : "text-primary"
              )}
            />
          </div>
          <div
            className={cn(
              "text-sm",
              featured ? "text-muted-foreground" : "text-muted-foreground"
            )}
          >
            {role},{" "}
            <span
              className={cn(
                "font-medium",
                featured ? "text-primary" : "text-primary"
              )}
            >
              {company}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 11H6C5.46957 11 4.96086 11.2107 4.58579 11.5858C4.21071 11.9609 4 12.4696 4 13V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H10V11ZM10 11V7C10 5.34315 11.3431 4 13 4M20 11H16C15.4696 11 14.9609 11.2107 14.5858 11.5858C14.2107 11.9609 14 12.4696 14 13V19C14 19.5304 14.2107 20.0391 14.5858 20.4142C14.9609 20.7893 15.4696 21 16 21H20V11ZM20 11V7C20 5.34315 21.3431 4 23 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
