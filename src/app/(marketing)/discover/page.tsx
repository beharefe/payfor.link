import { trackServer } from "@unseallink/lib/amplitude-server";
import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AirtableIcon,
  CanvaIcon,
  DiscordIcon,
  FigmaIcon,
  FreeUnlockIcon,
  GitHubIcon,
  GoogleDriveIcon,
  NotionIcon,
  OtherAccessIcon,
} from "./platform-icons";
import { DiscoverProductCard } from "./product-card";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
const IS_SHUTDOWN = process.env.UNSEAL_SHUTDOWN_MODE === "true";

export const metadata: Metadata = {
  title: "Discover Access Products | unseal.link",
  description:
    "Browse Notion templates, Figma files, Discord communities, and private links you can unlock instantly through unseal.",
  alternates: { canonical: `${APP_URL}/discover` },
  robots: IS_SHUTDOWN ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: {
    title: "Discover Access Products | unseal.link",
    description:
      "Browse Notion templates, Figma files, Discord communities, and private links you can unlock instantly through unseal.",
    url: `${APP_URL}/discover`,
    siteName: "unseal.link",
    type: "website",
  },
};

// Order by paid-access strength: communities → templates → repos → files → niche
const CATEGORIES = [
  { label: "All", platform: null },
  { label: "Notion", platform: "notion" },
  { label: "Figma", platform: "figma" },
  { label: "Discord", platform: "discord" },
  { label: "GitHub", platform: "github" },
  { label: "Google Drive", platform: "google_drive" },
  { label: "Canva", platform: "canva" },
  { label: "Airtable", platform: "airtable" },
  { label: "Free", platform: "free" },
  { label: "Other", platform: "other" },
];

const CATEGORY_CARDS = [
  {
    label: "Notion Templates",
    description: "Pages, databases, wikis, and full OS systems.",
    platform: "notion",
    Icon: NotionIcon,
  },
  {
    label: "Figma Templates",
    description: "UI kits, components, icons, and design systems.",
    platform: "figma",
    Icon: FigmaIcon,
  },
  {
    label: "Discord Access",
    description: "Private communities, workshops, study groups, and creator spaces.",
    platform: "discord",
    Icon: DiscordIcon,
  },
  {
    label: "GitHub Boilerplates",
    description: "Starter repos, templates, and production-ready code.",
    platform: "github",
    Icon: GitHubIcon,
  },
  {
    label: "Google Drive Resources",
    description: "Docs, spreadsheets, presentations, and shared files.",
    platform: "google_drive",
    Icon: GoogleDriveIcon,
  },
  {
    label: "Canva Templates",
    description: "Social content, pitch decks, and marketing assets.",
    platform: "canva",
    Icon: CanvaIcon,
  },
  {
    label: "Airtable Templates",
    description: "Bases, workflows, and data-driven templates.",
    platform: "airtable",
    Icon: AirtableIcon,
  },
  {
    label: "Free Unlocks",
    description: "Free resources you can unlock instantly.",
    platform: "free",
    Icon: FreeUnlockIcon,
  },
];

type Props = {
  searchParams: Promise<{ platform?: string }>;
};

export default async function DiscoverPage({ searchParams }: Props) {
  if (IS_SHUTDOWN) {
    return (
      <>
        <section className="pt-20 pb-12 px-6 max-w-5xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
            Discover
          </p>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4 leading-[1.1]">
            unseal Discover is closed
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
            unseal.link is shutting down and public discovery is no longer accepting listings.
            Existing buyer access links remain available during the shutdown period.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:opacity-90 transition-opacity no-underline"
            >
              Go home
            </Link>
            <a
              href="mailto:support@unseal.link"
              className="inline-flex items-center px-5 py-2.5 border border-border rounded-full font-medium text-sm hover:bg-muted transition-colors no-underline text-foreground"
            >
              Contact support
            </a>
          </div>
        </section>
      </>
    );
  }

  const { platform: rawPlatform } = await searchParams;
  const activePlatform =
    CATEGORIES.find((c) => c.platform === rawPlatform)?.platform ?? null;

  const supabase = createServiceClient();

  let query = supabase
    .from(TABLES.PRODUCTS)
    .select(
      "id, title, description, slug, price, currency, preview_image_url, total_sales, destination_platform, sellers!inner(name, username, avatar_url, profile_public)",
    )
    .eq("status", "active")
    .eq("public_status", "approved")
    .eq("sellers.profile_public", true)
    .order("total_sales", { ascending: false });

  if (activePlatform === "free") {
    // Free unlocks: price = 0 (no min-price products yet, future use)
    query = query.eq("price", 0);
  } else if (activePlatform === "other") {
    query = query.is("destination_platform", null);
  } else if (activePlatform) {
    query = query.eq("destination_platform", activePlatform);
  }

  const { data: rawProducts } = await query.limit(48);
  // biome-ignore lint/suspicious/noExplicitAny: Supabase join
  const products = (rawProducts ?? []) as any[];

  void trackServer({
    name: "Discover Page Viewed",
    props: { platform_filter: activePlatform, total_results: products.length },
  });

  const activeLabel =
    CATEGORIES.find((c) => c.platform === activePlatform)?.label ?? null;

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
          Browse templates, communities, repositories, and private resources you
          can unlock instantly through unseal.
        </p>
        <p className="text-xs text-muted-foreground border border-border rounded-full inline-flex items-center gap-1.5 px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
          Public listings are reviewed before appearing here. Content is provided by sellers.
        </p>
      </section>

      {/* Category filter pills */}
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
                {activeLabel
                  ? `No approved ${activeLabel} listings yet.`
                  : "No approved listings yet."}
              </p>
              <p className="text-xs text-muted-foreground">
                Sellers can submit their active products for review from their
                dashboard.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product, i) => {
                // biome-ignore lint/suspicious/noExplicitAny: Supabase join
                const seller = product.sellers as any;
                return (
                  <DiscoverProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    description={product.description}
                    slug={product.slug}
                    price={product.price}
                    preview_image_url={product.preview_image_url}
                    destination_platform={product.destination_platform}
                    sellerUsername={seller?.username ?? null}
                    position={i}
                  />
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
            {CATEGORY_CARDS.map((cat) => (
              <Link
                key={cat.platform}
                href={`/discover?platform=${cat.platform}`}
                className={`border border-border rounded-2xl p-4 bg-background hover:bg-muted/50 transition-colors no-underline group ${
                  activePlatform === cat.platform ? "border-foreground/30" : ""
                }`}
              >
                <div className="mb-3">
                  <cat.Icon size={28} />
                </div>
                <p className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors leading-snug mb-1">
                  {cat.label}
                </p>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
          {/* Discord safety note */}
          <p className="text-xs text-muted-foreground mt-4 max-w-lg">
            Discord listings are manually reviewed. Trading signals, gambling,
            adult, illegal, or deceptive communities are not allowed.
          </p>
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
