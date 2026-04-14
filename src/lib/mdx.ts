import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content/pages");

export interface PageFrontmatter {
  title: string;
  description: string;
  og_title?: string;
  og_description?: string;
  noindex?: boolean;
  schema_type?: "WebPage" | "Article" | "FAQPage";
  published?: boolean;
  cta_text?: string;
  cta_href?: string;
  related?: string[];
}

export interface MdxPage {
  slug: string;
  frontmatter: PageFrontmatter;
  content: string;
}

export function getAllPageSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getPageBySlug(slug: string): MdxPage | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  if (data.published === false) return null;
  return { slug, frontmatter: data as PageFrontmatter, content };
}
