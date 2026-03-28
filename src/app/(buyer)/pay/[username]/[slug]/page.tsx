import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { Clock, LockKeyhole, Mail, Timer } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AbuseReportForm } from "../../abuse-report-form";
import { PaywallCTA } from "../../paywall-cta";

type Props = { params: Promise<{ username: string; slug: string }> };

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select("title, description, price, sellers!inner(username)")
    .eq("slug", slug)
    .eq("sellers.username", username)
    .not("status", "in", '("deleted","suspended")')
    .single();

  if (!link) return { title: "Not found" };

  const baseUrl = await getBaseUrl();
  const title = `${link.title} — $${link.price}`;
  const description = link.description ?? "Pay once and get instant access.";

  const canonical = `${baseUrl}/@${username}/${slug}`;
  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: `${baseUrl}/api/og/${slug}`, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/api/og/${slug}`],
    },
  };
}

export default async function PaywallPage({ params }: Props) {
  const { username, slug } = await params;
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select(
      "id, title, description, price, currency, seller_id, status, preview_image_url, total_sales, expires_at, sellers!inner(name, username)",
    )
    .eq("slug", slug)
    .eq("sellers.username", username)
    .single();

  if (!link) notFound();

  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();

  if (link.status !== "active" || isExpired) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <h1 className="text-xl font-medium text-foreground mb-2">
            {isExpired ? "Offer expired" : "No longer available"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isExpired
              ? "This offer is no longer accepting payments."
              : "This product has been removed or is paused."}
          </p>
        </div>
      </main>
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  const seller = link.sellers as any;
  log.info("paywall_viewed", { link_id: link.id, slug, username });

  function formatTimeUntil(expiresAt: string): string {
    const ms = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(ms / 3600000);
    if (hours >= 48) return `${Math.floor(hours / 24)} days`;
    if (hours >= 24) return "1 day";
    if (hours > 1) return `${hours} hours`;
    return "less than an hour";
  }

  const expiresAt = link.expires_at as string | null;

  const salesCount = link.total_sales ?? 0;
  const baseUrl = await getBaseUrl();
  const canonical = `${baseUrl}/@${username}/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: link.title,
    description: link.description ?? undefined,
    url: canonical,
    offers: {
      "@type": "Offer",
      price: link.price.toFixed(2),
      priceCurrency: link.currency.toUpperCase(),
      availability: "https://schema.org/InStock",
      url: canonical,
      seller: {
        "@type": "Person",
        name: seller?.name ?? username,
      },
    },
  };

  return (
    <main className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-16">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full max-w-sm space-y-3">

        {/* Preview image */}
        {link.preview_image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted">
            <img
              src={link.preview_image_url}
              alt={link.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Main card */}
        <div className="border border-border rounded-2xl bg-card p-6 space-y-5">

          {/* Title + description */}
          <div>
            {expiresAt && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium cursor-default"
                title={new Date(expiresAt).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
              >
                <Clock className="w-3 h-3" aria-hidden="true" />
                Limited offer · expires in {formatTimeUntil(expiresAt)}
              </div>
            )}
            <h1 className="text-2xl font-medium tracking-tight text-foreground leading-snug mb-2">
              {link.title}
            </h1>
            {link.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {link.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-medium text-foreground tabular-nums">
              ${link.price.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">
              {link.currency.toUpperCase()} · one-time
            </span>
            {salesCount > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {salesCount} {salesCount === 1 ? "sale" : "sales"}
              </span>
            )}
          </div>

          {/* CTA */}
          <PaywallCTA linkId={link.id} />

          {/* Trust row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { icon: LockKeyhole, label: "Secure" },
              { icon: Mail,        label: "By email" },
              { icon: Timer,       label: "24h link" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-muted/50"
              >
                <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-[11px] text-muted-foreground leading-none">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Seller card */}
        <div className="border border-border rounded-2xl px-5 py-4 bg-card flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-medium text-foreground shrink-0">
              {(seller?.name ?? username).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-0.5">
                Sold by
              </p>
              <Link
                href={`/@${username}`}
                className="text-sm font-medium text-foreground hover:underline"
              >
                {seller?.name ?? username}
              </Link>
            </div>
          </div>
          <Link
            href="/"
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            unseal.link
          </Link>
        </div>

        {/* Report */}
        <div className="text-center">
          <AbuseReportForm productId={link.id} />
        </div>
      </div>
    </main>
  );
}
