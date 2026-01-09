import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface Author {
  name: string;
  avatar?: string;
  role?: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: string;
  category?: string;
  image?: string;
  author?: Author;
  featured?: boolean;
  tags?: string[];
}

export interface Post extends PostMeta {
  content: string;
}

function ensureBlogDir() {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }
}

export function getAllPosts(): PostMeta[] {
  ensureBlogDir();

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".mdx"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      date: data.date || new Date().toISOString(),
      readingTime: readingTime(content).text,
      category: data.category || undefined,
      image: data.image || undefined,
      author: data.author || { name: "Saasy Team" },
      featured: data.featured || false,
      tags: data.tags || [],
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): Post | null {
  ensureBlogDir();

  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date || new Date().toISOString(),
    readingTime: readingTime(content).text,
    category: data.category || undefined,
    image: data.image || undefined,
    author: data.author || { name: "Saasy Team" },
    featured: data.featured || false,
    tags: data.tags || [],
    content,
  };
}

export function getAllSlugs(): string[] {
  ensureBlogDir();

  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getRelatedPosts(currentSlug: string, limit = 3): PostMeta[] {
  const allPosts = getAllPosts();
  const currentPost = allPosts.find((p) => p.slug === currentSlug);

  if (!currentPost) return [];

  return allPosts
    .filter((p) => p.slug !== currentSlug)
    .filter(
      (p) =>
        p.category === currentPost.category ||
        p.tags?.some((tag) => currentPost.tags?.includes(tag))
    )
    .slice(0, limit);
}
