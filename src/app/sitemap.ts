import { TABLES } from "@unseallink/lib/db";
import { getAllPageSlugs } from "@unseallink/lib/mdx";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, changeFrequency: "weekly", priority: 1.0 },
  ];

  // MDX content/SEO pages (statically generated at build time)
  const mdxRoutes: MetadataRoute.Sitemap = getAllPageSlugs().map((slug) => ({
    url: `${APP_URL}/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Active paywall product pages — indexable by search engines and AI crawlers
  let paywallRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServiceClient();
    const { data: products } = await supabase
      .from(TABLES.PRODUCTS)
      .select("slug, updated_at, sellers!inner(name)")
      .eq("status", "active");

    if (products) {
      paywallRoutes = products.map((p) => {
        const seller = p.sellers as unknown as { name: string };
        return {
          url: `${APP_URL}/pay/${seller.name}/${p.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.6,
          lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        };
      });
    }
  } catch {
    // Non-fatal — sitemap still works without live product pages
  }

  return [...staticRoutes, ...mdxRoutes, ...paywallRoutes];
}
