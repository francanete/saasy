import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Sparkles } from "lucide-react";
import { appConfig } from "@/lib/config";

const features = [
  {
    title: "Fast & Modern",
    description:
      "Built with Next.js 16, Tailwind CSS, and TypeScript for the best developer experience.",
    icon: Zap,
  },
  {
    title: "Secure by Default",
    description:
      "Better Auth for authentication, with OAuth support and secure session management.",
    icon: Shield,
  },
  {
    title: "AI-Ready",
    description:
      "Integrated with Google AI SDK for building intelligent features.",
    icon: Sparkles,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-24 text-center">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="mb-6 text-4xl font-bold md:text-6xl">
            Build Your SaaS
            <br />
            <span className="text-primary">Faster Than Ever</span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
            A modern, production-ready SaaS boilerplate with authentication,
            payments, AI integration, and everything you need to launch.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything You Need
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="text-primary mb-2 h-10 w-10" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center md:px-6">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 text-xl">
            Join thousands of developers building with {appConfig.name}.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Start Building Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
