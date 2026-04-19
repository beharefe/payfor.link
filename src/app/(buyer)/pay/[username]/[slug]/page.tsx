import { TABLES } from "@unseallink/lib/db";
import { sendMissedSaleEmail } from "@unseallink/lib/email";
import { log } from "@unseallink/lib/logger";
import { trackServer } from "@unseallink/lib/amplitude-server";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { ArrowUpRight, Check, Clock, CreditCard, LockKeyhole, Mail, Plus, Timer } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
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
    .select("title, description, price, currency, preview_image_url, expires_at, max_orders, total_sales, sellers!inner(username, name)")
    .eq("slug", slug)
    .eq("sellers.username", username)
    .not("status", "in", '("deleted","suspended")')
    .single();

  if (!link) return { title: "Not found" };

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  const sellerData = link.sellers as any;
  const sellerName: string = sellerData?.name ?? sellerData?.username ?? "unseal.link";

  const isUnavailable =
    (link.expires_at && new Date(link.expires_at) < new Date()) ||
    (link.max_orders !== null && link.max_orders !== undefined && (link.total_sales ?? 0) >= link.max_orders);

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
  const ogImage = ogUrl.toString();

  return {
    title,
    description,
    themeColor: "#111111",
    metadataBase: new URL(baseUrl),
    alternates: { canonical },
    robots: isUnavailable ? { index: false, follow: false } : { index: true, follow: true },
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

const sectionLabel = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

function PurchaseCard({
  link,
  expiresAt,
  salesCount,
  formatTimeUntil,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: complex join type
  link: any;
  expiresAt: string | null;
  salesCount: number;
  formatTimeUntil: (s: string) => string;
}) {
  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Badges: expiry and/or scarcity */}
        {(expiresAt || link.max_orders !== null) && (
          <div className="flex flex-wrap gap-2">
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
        <PaywallCTA linkId={link.id} price={link.price} />

        {/* Trust row */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {[
            { icon: LockKeyhole, label: "Stripe-secured" },
            { icon: Mail, label: "Email delivery" },
            { icon: Timer, label: "No account" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-[11px] text-muted-foreground leading-none">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function PaywallPage({ params }: Props) {
  const { username, slug } = await params;
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select(
      "id, title, subtitle, description, includes, faq, price, currency, seller_id, status, preview_image_url, total_sales, expires_at, max_orders, sellers!inner(name, username, email, stripe_connected, bio, avatar_url, twitter_handle, website_url, profile_public)",
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
        <div className="text-center max-w-xs space-y-3">
          <h1 className="text-xl font-medium text-foreground">
            {isSoldOut ? "Sold out" : isExpired ? "Offer expired" : "No longer available"}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isSoldOut
              ? "This link was limited to one buyer and has already been purchased."
              : isExpired
              ? "This offer closed and is no longer accepting payments."
              : "This product is paused or has been removed by the seller."}
          </p>
          <Link
            href="/"
            className="inline-block text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            unseal.link
          </Link>
        </div>
      </main>
    );
  }

  const seller = sellerData;
  log.info("paywall_viewed", { link_id: link.id, slug, username });
  void trackServer({
    name: "Sealed Link Opened",
    props: {
      link_id: link.id,
      link_token_present: false,
      delivery_channel: "direct",
    },
  });

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

  // biome-ignore lint/suspicious/noExplicitAny: JSONB from Supabase
  const faqItems = (link.faq as Array<{ q: string; a: string }> | null) ?? [];
  const includesItems = (link.includes as string[] | null) ?? [];

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
    <main className="min-h-dvh bg-background pb-24 lg:pb-0">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sticky nav */}
      <nav className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/"
            className="text-sm font-medium text-foreground hover:opacity-70 transition-opacity"
          >
            unseal.link
          </Link>
          <Link
            href={`/@${username}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {seller?.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller?.name ?? username}
                className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-medium text-foreground shrink-0">
                {(seller?.name ?? username).charAt(0).toUpperCase()}
              </div>
            )}
            <span>@{username}</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-12 lg:items-start">

          {/* Left column */}
          <div className="space-y-8">

            {/* Title + subtitle — always at top of left column */}
            <div>
              {/* Urgency badges on mobile (PurchaseCard is desktop-only) */}
              {(expiresAt || link.max_orders !== null) && (
                <div className="flex flex-wrap gap-2 mb-3 lg:hidden">
                  {expiresAt && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
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
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-snug">
                {link.title}
              </h1>
              {link.subtitle && (
                <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                  {link.subtitle}
                </p>
              )}
            </div>

            {/* Preview image */}
            {link.preview_image_url && (
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted relative">
                <Image
                  src={link.preview_image_url}
                  alt={link.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 680px"
                  className="object-cover"
                />
              </div>
            )}

            {/* Description — no label, shown as primary copy */}
            {link.description && (
              <p className="text-base text-foreground leading-relaxed">
                {link.description}
              </p>
            )}

            {/* What's included */}
            {includesItems.length > 0 && (
              <div>
                <p className={`${sectionLabel} mb-3`}>What&apos;s included</p>
                <ul className="space-y-2.5">
                  {includesItems.map((item, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static list
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-sm text-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* How it works */}
            <div>
              <p className={`${sectionLabel} mb-3`}>How it works</p>
              <div className="border border-border rounded-2xl bg-card overflow-hidden divide-y divide-border">
                {[
                  {
                    icon: CreditCard,
                    title: "Pay securely with Stripe",
                    desc: "Card, Apple Pay, or Google Pay. Your card details never touch our servers.",
                    badge: null,
                  },
                  {
                    icon: Mail,
                    title: "Get your access link by email",
                    desc: "Sent to the email you enter at checkout",
                    badge: "Under 30 sec",
                  },
                  {
                    icon: LockKeyhole,
                    title: "Click the link to get access",
                    desc: "No account or password needed",
                    badge: null,
                  },
                ].map(({ icon: Icon, title, desc, badge }, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static list
                  <div key={i} className="flex items-start gap-3.5 p-4">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="size-4 text-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{title}</p>
                        {badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            {badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            {faqItems.length > 0 && (
              <div>
                <p className={`${sectionLabel} mb-3`}>FAQ</p>
                <div className="border border-border rounded-2xl bg-card overflow-hidden divide-y divide-border">
                  {faqItems.map((item, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static list
                    <details key={i} className="group px-5 py-4">
                      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-medium text-foreground select-none">
                        <span>{item.q}</span>
                        <Plus className="size-4 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
                      </summary>
                      <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Seller card */}
            <div className="border border-border rounded-2xl p-4 bg-card">
              <div className="flex items-start gap-3">
                {seller?.avatar_url ? (
                  <img
                    src={seller.avatar_url}
                    alt={seller?.name ?? username}
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium text-foreground shrink-0">
                    {(seller?.name ?? username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground leading-none mb-1">Sold by</p>
                  <Link
                    href={`/@${username}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {seller?.name ?? username}
                  </Link>
                  {seller?.bio && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                      {seller.bio}
                    </p>
                  )}
                  {(seller?.twitter_handle || seller?.website_url) && (
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {seller.twitter_handle && (
                        <a
                          href={`https://x.com/${seller.twitter_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          @{seller.twitter_handle}
                          <ArrowUpRight className="size-3" aria-hidden="true" />
                        </a>
                      )}
                      {seller.website_url && (
                        <a
                          href={seller.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Website
                          <ArrowUpRight className="size-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-4">
              <AbuseReportForm productId={link.id} />
              <p className="text-[11px] text-muted-foreground">
                Payments by{" "}
                <span className="font-medium text-foreground">Stripe</span>
              </p>
            </div>
          </div>

          {/* Right column: sticky purchase card (desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <PurchaseCard
                link={link}
                expiresAt={expiresAt}
                salesCount={salesCount}
                formatTimeUntil={formatTimeUntil}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm px-4 pt-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3 max-w-sm mx-auto">
          <div className="shrink-0 text-center">
            <p className="text-xl font-medium tabular-nums text-foreground leading-none">
              ${link.price.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">one-time</p>
          </div>
          <div className="flex-1">
            <PaywallCTA linkId={link.id} price={link.price} />
          </div>
        </div>
      </div>
    </main>
  );
}
