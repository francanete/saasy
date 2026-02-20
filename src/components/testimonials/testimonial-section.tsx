"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { testimonialsConfig } from "@/lib/testimonials-config";
import { TestimonialCard } from "./testimonial-card";

interface TestimonialSectionProps {
  className?: string;
}

export function TestimonialSection({ className }: TestimonialSectionProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useIntersectionObserver(ref, {
    threshold: 0.1,
    triggerOnce: true,
  });

  const { header, testimonials } = testimonialsConfig;

  return (
    <section
      ref={ref}
      className={cn(
        "from-muted to-background bg-gradient-to-b py-24 lg:py-32",
        className
      )}
      aria-labelledby="testimonial-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={cn(
            "mx-auto mb-16 max-w-3xl text-center lg:mb-20",
            "transition-all duration-700 ease-out",
            isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
        >
          {/* Badge */}
          <div className="border-primary/20 bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold">
            <span className="bg-primary mr-2 flex h-2 w-2 rounded-full" />
            {header.badge}
          </div>

          {/* Title */}
          <h2
            id="testimonial-heading"
            className="from-foreground via-foreground/90 to-foreground/60 mb-6 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl"
          >
            {header.title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed lg:text-xl">
            {header.description}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid auto-rows-[minmax(200px,auto)] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              isInView={isInView}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
