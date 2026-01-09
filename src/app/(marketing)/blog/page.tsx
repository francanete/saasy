import { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/blog-card";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Blog | ${appConfig.name}`,
  description: `Latest news, tutorials, and updates from ${appConfig.name}.`,
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Blog</h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Insights, tutorials, and updates from our team.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <p>No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
