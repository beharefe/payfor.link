import { getAllPageSlugs } from "@unseallink/lib/mdx";
import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, changeFrequency: "weekly", priority: 1.0 },
    {
      url: `${APP_URL}/how-it-works`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${APP_URL}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${APP_URL}/auth`, changeFrequency: "yearly", priority: 0.5 },
  ];

  const mdxRoutes: MetadataRoute.Sitemap = getAllPageSlugs().map((slug) => ({
    url: `${APP_URL}/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...mdxRoutes];
}
