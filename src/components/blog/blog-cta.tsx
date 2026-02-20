import Link from "next/link";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";

export function BlogCta() {
  return (
    <section className="bg-primary text-primary-foreground py-24">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
          Ready to collect better feedback?
        </h2>
        <p className="text-primary-foreground/70 mx-auto mb-10 max-w-2xl text-lg md:text-xl">
          {appConfig.name} helps you capture, organize, and prioritize feature
          requests — start your free trial today, cancel anytime.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="bg-background text-foreground hover:bg-muted h-12 w-full px-8 font-semibold sm:w-auto"
            asChild
          >
            <Link href="/pricing">Start Free Trial</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-border text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground h-12 w-full bg-transparent px-8 sm:w-auto"
            asChild
          >
            <Link href="/">See How It Works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
