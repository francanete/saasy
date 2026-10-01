"use client";

import { cn } from "@/lib/utils";
import { FeatureShowcase } from "@/components/features/feature-showcase";
import { homepageFeaturesConfig } from "@/lib/features-config";

interface FeaturesSectionProps {
  className?: string;
}

export function FeaturesSection({ className }: FeaturesSectionProps) {
  const config = homepageFeaturesConfig;

  return (
    <section id={config.id} className={cn("bg-background py-32", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-24 max-w-2xl">
          <h2 className="text-foreground mb-4 text-5xl font-semibold tracking-tight">
            {config.header.title}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {config.header.description}
          </p>
        </div>

        {/* Features Stack */}
        <div className="space-y-32">
          {config.features.map((feature) => (
            <FeatureShowcase key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
