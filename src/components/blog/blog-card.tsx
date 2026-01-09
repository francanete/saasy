import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import type { PostMeta } from "@/lib/blog";

interface BlogCardProps {
  post: PostMeta;
}

export function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="line-clamp-2">{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {post.description}
          </p>
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
        </CardContent>
      </Card>
    </Link>
  );
}
