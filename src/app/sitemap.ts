import { TABLES } from "@unseallink/lib/db";
import { getAllPageSlugs, getPageBySlug } from "@unseallink/lib/mdx";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL,              changeFrequency: "weekly",  priority: 1.0 },
    { url: `${APP_URL}/discover`, changeFrequency: "daily",   priority: 0.9 },
    { url: `${APP_URL}/about`,   changeFrequency: "monthly", priority: 0.5 },
  ];

  // MDX content/SEO pages — exclude noindex pages (privacy, terms, etc.)
  const mdxRoutes: MetadataRoute.Sitemap = getAllPageSlugs()
    .filter((slug) => {
      const page = getPageBySlug(slug);
      return page && !page.frontmatter.noindex;
    })
    .map((slug) => ({
      url: `${APP_URL}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  let productRoutes: MetadataRoute.Sitemap = [];
  let approvedProductRoutes: MetadataRoute.Sitemap = [];
  let sellerRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createServiceClient();

    const [{ data: products }, { data: sellers }] = await Promise.all([
      supabase
        .from(TABLES.PRODUCTS)
        .select("slug, updated_at, public_status, sellers!inner(username)")
        .eq("status", "active"),
      supabase
        .from(TABLES.SELLERS)
        .select("username, updated_at")
        .eq("profile_public", true),
    ]);

    if (products) {
      const approved = products.filter((p) => p.public_status === "approved");
      const others   = products.filter((p) => p.public_status !== "approved");

      // Approved Discover listings: highest priority — these are the ones
      // buyers find via /discover and that Google should rank for.
      approvedProductRoutes = approved.map((p) => {
        const seller = p.sellers as unknown as { username: string };
        return {
          url: `${APP_URL}/@${seller.username}/${p.slug}`,
          changeFrequency: "daily" as const,
          priority: 0.85,
          lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        };
      });

      // Private products still get indexed (seller may share link directly)
      // but at lower priority than approved Discover listings.
      productRoutes = others.map((p) => {
        const seller = p.sellers as unknown as { username: string };
        return {
          url: `${APP_URL}/@${seller.username}/${p.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.6,
          lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        };
      });
    }

    if (sellers) {
      sellerRoutes = sellers.map((s) => ({
        url: `${APP_URL}/@${s.username}`,
        changeFrequency: "weekly" as const,
        priority: 0.5,
        lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
      }));
    }
  } catch {
    // Non-fatal — sitemap still works without live pages
  }

  return [...staticRoutes, ...mdxRoutes, ...sellerRoutes, ...approvedProductRoutes, ...productRoutes];
}
