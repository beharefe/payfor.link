import { TABLES } from "@unseallink/lib/db";
import { sendMissedSaleEmail } from "@unseallink/lib/email";
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
    .select("title, description, price, currency, preview_image_url, sellers!inner(username, name)")
    .eq("slug", slug)
    .eq("sellers.username", username)
    .not("status", "in", '("deleted","suspended")')
    .single();

  if (!link) return { title: "Not found" };

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  const sellerData = link.sellers as any;
  const sellerName: string = sellerData?.name ?? sellerData?.username ?? "unseal.link";

  const baseUrl = await getBaseUrl();
  const priceLabel = `$${Number(link.price).toFixed(2)}`;
  const title = `${link.title} · ${priceLabel}`;
  const description = link.description
    ? `${link.description}`
    : `Pay once with Stripe and get instant access. No account needed.`;

  const canonical = `${baseUrl}/@${username}/${slug}`;

  const ogUrl = new URL(`${baseUrl}/api/og/${slug}`);
  ogUrl.searchParams.set("t", link.title);
  ogUrl.searchParams.set("p", priceLabel);
  if (sellerName && sellerName !== "unseal.link") ogUrl.searchParams.set("s", sellerName);
  if (link.preview_image_url) ogUrl.searchParams.set("i", link.preview_image_url);
  const ogImage = ogUrl.toString();

  return {
    title,
    description,
    themeColor: "#111111",
    metadataBase: new URL(baseUrl),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "unseal.link",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@unseallink",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "product:price:amount": Number(link.price).toFixed(2),
      "product:price:currency": (link.currency ?? "usd").toUpperCase(),
      "twitter:label1": "Price",
      "twitter:data1": priceLabel,
      "twitter:label2": "Seller",
      "twitter:data2": sellerName,
    },
  };
}

export default async function PaywallPage({ params }: Props) {
  const { username, slug } = await params;
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select(
      "id, title, description, price, currency, seller_id, status, preview_image_url, total_sales, expires_at, max_orders, sellers!inner(name, username, email, stripe_connected)",
    )
    .eq("slug", slug)
    .eq("sellers.username", username)
    .single();

  if (!link) notFound();

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  const sellerData = link.sellers as any;
  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
  const isSoldOut = link.max_orders !== null && link.max_orders !== undefined && (link.total_sales ?? 0) >= link.max_orders;

  if (link.status !== "active" || isExpired || isSoldOut) {
    // Notify seller if their link is draft because Stripe isn't connected
    if (link.status === "draft" && !sellerData?.stripe_connected && sellerData?.email) {
      const h = await headers();
      const host = h.get("host") ?? "unseal.link";
      const proto = h.get("x-forwarded-proto") ?? "https";
      await sendMissedSaleEmail({
        to: sellerData.email,
        sellerName: sellerData.name ?? "",
        productTitle: link.title,
        dashboardUrl: `${proto}://${host}/dashboard`,
      }).catch((err) => log.error("missed_sale_email_failed", { error: err?.message, seller_id: link.seller_id }));
    }

    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <h1 className="text-xl font-medium text-foreground mb-2">
            {isSoldOut ? "Sold out" : isExpired ? "Offer expired" : "No longer available"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isSoldOut
              ? "This was a one-buyer link. It has already been purchased."
              : isExpired
              ? "This offer is no longer accepting payments."
              : "This product has been removed or is paused."}
          </p>
        </div>
      </main>
    );
  }

  const seller = sellerData;
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
            {/* Badges: expiry and/or scarcity */}
            {(expiresAt || link.max_orders !== null) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {expiresAt && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium cursor-default"
                    title={new Date(expiresAt).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  >
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    Limited offer · expires in {formatTimeUntil(expiresAt)}
                  </div>
                )}
                {link.max_orders !== null && link.max_orders !== undefined && (() => {
                  const slotsLeft = link.max_orders - (link.total_sales ?? 0);
                  return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-full text-xs font-medium">
                      <span className="size-1.5 rounded-full bg-current shrink-0" />
                      {slotsLeft === 1 ? "Only 1 spot remaining" : `${slotsLeft} spots remaining`}
                    </div>
                  );
                })()}
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
              { icon: Timer,       label: "Instant" },
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

        {/* Stripe trust */}
        <p className="text-center text-[11px] text-muted-foreground">
          Payments &amp; refunds handled by{" "}
          <span className="font-medium text-foreground">Stripe</span>
        </p>
      </div>
    </main>
  );
}
