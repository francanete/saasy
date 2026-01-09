import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { appConfig } from "@/lib/config";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: `Post Not Found | ${appConfig.name}`,
    };
  }

  return {
    title: `${post.title} | ${appConfig.name}`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="py-24">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="mb-4 text-4xl font-bold">{post.title}</h1>
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readingTime}
              </span>
            </div>
          </header>

          <div className="max-w-none">
            {post.content.split("\n").map((paragraph, index) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith("# ")) {
                return (
                  <h1 key={index} className="mt-8 mb-4 text-3xl font-bold">
                    {trimmed.slice(2)}
                  </h1>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h2 key={index} className="mt-6 mb-3 text-2xl font-semibold">
                    {trimmed.slice(3)}
                  </h2>
                );
              }
              if (trimmed.startsWith("### ")) {
                return (
                  <h3 key={index} className="mt-4 mb-2 text-xl font-semibold">
                    {trimmed.slice(4)}
                  </h3>
                );
              }
              if (trimmed.startsWith("- ")) {
                return (
                  <li key={index} className="ml-4">
                    {trimmed.slice(2)}
                  </li>
                );
              }

              return (
                <p key={index} className="text-muted-foreground mb-4">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </article>
      </div>
    </div>
  );
}
