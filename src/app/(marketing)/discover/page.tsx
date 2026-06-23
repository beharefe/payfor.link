import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export const metadata: Metadata = {
  title: "Discover Access Products | unseal.link",
  description:
    "Browse Notion templates, Figma files, resources, and private links you can unlock instantly through unseal.",
  alternates: { canonical: `${APP_URL}/discover` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Discover Access Products | unseal.link",
    description:
      "Browse Notion templates, Figma files, resources, and private links you can unlock instantly through unseal.",
    url: `${APP_URL}/discover`,
    siteName: "unseal.link",
    type: "website",
  },
};

const CATEGORIES = [
  { label: "All", platform: null },
  { label: "Notion", platform: "notion" },
  { label: "Figma", platform: "figma" },
  { label: "Canva", platform: "canva" },
  { label: "Airtable", platform: "airtable" },
  { label: "GitHub", platform: "github" },
  { label: "Google Drive", platform: "google_drive" },
  { label: "Other", platform: "other" },
];

const PLATFORM_LABEL: Record<string, string> = {
  notion: "Notion",
  figma: "Figma",
  canva: "Canva",
  airtable: "Airtable",
  github: "GitHub",
  gitlab: "GitLab",
  google_drive: "Google Drive",
  google_docs: "Google Docs",
  google_sheets: "Google Sheets",
  google_slides: "Google Slides",
  loom: "Loom",
  typeform: "Typeform",
  dropbox: "Dropbox",
  discord: "Discord",
  substack: "Substack",
  beehiiv: "Beehiiv",
  framer: "Framer",
  webflow: "Webflow",
};

type Props = {
  searchParams: Promise<{ platform?: string }>;
};

export default async function DiscoverPage({ searchParams }: Props) {
  const { platform: rawPlatform } = await searchParams;
  // Only accept known platform values to prevent injection
  const activePlatform =
    CATEGORIES.find((c) => c.platform === rawPlatform)?.platform ?? null;

  const supabase = createServiceClient();

  let query = supabase
    .from(TABLES.PRODUCTS)
    .select(
      "id, title, description, slug, price, currency, preview_image_url, total_sales, destination_platform, destination_host, sellers!inner(name, username, avatar_url, profile_public)",
    )
    .eq("status", "active")
    .eq("public_status", "approved")
    .eq("sellers.profile_public", true)
    .order("total_sales", { ascending: false });

  if (activePlatform) {
    query = query.eq("destination_platform", activePlatform);
  }

  const { data: rawProducts } = await query.limit(48);
  // biome-ignore lint/suspicious/noExplicitAny: Supabase join
  const products = (rawProducts ?? []) as any[];

  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-12 px-6 max-w-5xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
          Discover
        </p>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4 leading-[1.1]">
          Discover access products
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6">
          Browse templates, files, resources, and private links you can unlock
          instantly through unseal.
        </p>
        <p className="text-xs text-muted-foreground border border-border rounded-full inline-flex items-center gap-1.5 px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
          Public listings are reviewed before appearing here. Content is
          provided by sellers.
        </p>
      </section>

      {/* Category filter */}
      <section className="border-t border-border px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = cat.platform === activePlatform;
              const href = cat.platform
                ? `/discover?platform=${cat.platform}`
                : "/discover";
              return (
                <Link
                  key={cat.label}
                  href={href}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors no-underline ${
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="border-t border-border py-10 px-6">
        <div className="max-w-5xl mx-auto">
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground text-sm mb-2">
                {activePlatform
                  ? `No approved ${PLATFORM_LABEL[activePlatform] ?? activePlatform} listings yet.`
                  : "No approved listings yet."}
              </p>
              <p className="text-xs text-muted-foreground">
                Sellers can submit their active products for review from their
                dashboard.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => {
                const seller = product.sellers as {
                  name: string | null;
                  username: string | null;
                };
                const platform = product.destination_platform as string | null;
                const platformLabel = platform
                  ? (PLATFORM_LABEL[platform] ?? null)
                  : null;
                const payUrl = `/@${seller.username}/${product.slug}`;

                return (
                  <Link
                    key={product.id}
                    href={payUrl}
                    className="group block border border-border rounded-2xl overflow-hidden bg-card no-underline hover:border-foreground/30 transition-colors"
                  >
                    {/* Preview image */}
                    {product.preview_image_url ? (
                      <div className="relative w-full aspect-[1.91/1] bg-muted overflow-hidden">
                        <Image
                          src={product.preview_image_url}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[1.91/1] bg-muted flex items-center justify-center">
                        <span className="text-3xl opacity-40">
                          {platform === "notion"
                            ? "📄"
                            : platform === "figma"
                              ? "🎨"
                              : platform === "github"
                                ? "💻"
                                : platform === "canva"
                                  ? "✏️"
                                  : platform === "airtable"
                                    ? "📊"
                                    : "🔗"}
                        </span>
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {/* Platform + reviewed badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {platformLabel && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {platformLabel}
                          </span>
                        )}
                        <span
                          className="text-xs text-muted-foreground ml-auto"
                          title="This listing was reviewed against unseal's public listing guidelines. Content is provided by the seller."
                        >
                          Reviewed listing
                        </span>
                      </div>

                      {/* Title */}
                      <p className="font-medium text-foreground leading-snug group-hover:text-foreground/80 transition-colors line-clamp-2">
                        {product.title}
                      </p>

                      {/* Description */}
                      {product.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      {/* Price + seller */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-medium text-foreground text-sm">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by @{seller.username}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Category cards */}
      <section className="border-t border-border py-16 md:py-20 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
            Browse by category
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { label: "Notion Templates", platform: "notion", emoji: "📄" },
              { label: "Figma Templates", platform: "figma", emoji: "🎨" },
              { label: "Canva Templates", platform: "canva", emoji: "✏️" },
              { label: "Airtable Templates", platform: "airtable", emoji: "📊" },
              { label: "GitHub Boilerplates", platform: "github", emoji: "💻" },
              { label: "Google Drive Resources", platform: "google_drive", emoji: "📁" },
            ].map((cat) => (
              <Link
                key={cat.platform}
                href={`/discover?platform=${cat.platform}`}
                className={`border border-border rounded-2xl p-4 bg-background hover:bg-muted/50 transition-colors no-underline group ${
                  activePlatform === cat.platform
                    ? "border-foreground/30"
                    : ""
                }`}
              >
                <span className="text-2xl block mb-2">{cat.emoji}</span>
                <p className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors leading-snug">
                  {cat.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Seller CTA */}
      <section className="border-t border-border py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Sell on unseal
            </p>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-4">
              Selling a template, file, repo, or private resource?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-md">
              Create a paid access product in under 5 minutes. Keep it private
              or submit it to unseal Discover for buyers to find.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:opacity-90 transition-opacity no-underline"
            >
              Create access product
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
