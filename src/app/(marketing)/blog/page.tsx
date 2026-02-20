import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/blog-card";
import { appConfig } from "@/lib/config";
import { Newspaper } from "lucide-react";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo.page({
  title: "Blog",
  description: `Tips, guides, and insights on collecting customer feedback and building better products with ${appConfig.name}.`,
  path: "/blog",
});

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="bg-background min-h-screen font-sans antialiased">
      {/* Hero Section */}
      <section className="from-muted/50 to-background relative overflow-hidden bg-linear-to-b py-12 md:py-16">
        {/* Subtle Background Pattern */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-foreground mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Tips, guides, <br className="hidden md:block" />
              <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
                and feedback insights.
              </span>
            </h1>

            <p className="text-muted-foreground mx-auto mb-6 max-w-2xl text-lg leading-relaxed">
              Learn how to collect better feedback, prioritize what matters, and
              build products your customers love.
            </p>

            {/* TODO: Implement category filtering
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category, index) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={
                      index === 0
                        ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200"
                        : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-foreground"
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
            */}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted ring-border mb-6 rounded-full p-6 ring-1">
                <Newspaper className="text-muted-foreground h-10 w-10" />
              </div>
              <h3 className="text-foreground mb-2 text-2xl font-bold">
                No posts found
              </h3>
              <p className="text-muted-foreground max-w-md">
                We couldn&apos;t find any posts. Check back later for new
                content!
              </p>
            </div>
          ) : (
            <div>
              <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>

              {/* TODO: Implement pagination
              <div className="mt-16 flex justify-center">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  Load More Articles
                </Button>
              </div>
              */}
            </div>
          )}
        </div>
      </section>

      {/* TODO: Implement newsletter subscription with Resend
      <section className="border-t bg-slate-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
              Subscribe to our newsletter
            </h2>
            <p className="mb-8 text-muted-foreground">
              Get the latest updates, articles, and resources sent straight to
              your inbox. No spam, unsubscribe anytime.
            </p>
            <form className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring rounded-md border px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-80"
                required
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
      </section>
      */}
    </div>
  );
}
