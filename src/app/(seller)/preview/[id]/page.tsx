import { TABLES } from "@unseallink/lib/db";
import { createClient, createServiceClient } from "@unseallink/lib/supabase/server";
import { ArrowUpRight, Check, Clock, CreditCard, Eye, LockKeyhole, Mail, Plus, Timer } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = createServiceClient();
  const { data: link } = await service
    .from(TABLES.PRODUCTS)
    .select("title, description, price, slug")
    .eq("id", id)
    .single();

  if (!link) return { title: "Not found" };

  const baseUrl = await getBaseUrl();
  const title = `${link.title} · $${link.price} (Preview)`;
  const description = link.description ?? "Pay once and get instant access.";

  return {
    title,
    description,
    robots: { index: false },
    openGraph: {
      title: `${link.title} · $${link.price}`,
      description,
      images: [{ url: `${baseUrl}/api/og/${link.slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${link.title} · $${link.price}`,
      description,
      images: [`${baseUrl}/api/og/${link.slug}`],
    },
  };
}

const sectionLabel = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

function PreviewPurchaseCard({
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
      {/* Cover image — top half of card */}
      {link.preview_image_url && (
        <div className="aspect-video w-full overflow-hidden relative border-b border-border">
          <Image
            src={link.preview_image_url}
            alt={link.title}
            fill
            sizes="360px"
            className="object-cover object-top"
          />
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Badges */}
        {(expiresAt || link.max_orders !== null) && (
          <div className="flex flex-wrap gap-2">
            {expiresAt && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium cursor-default">
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

        {/* Disabled CTA */}
        <button
          type="button"
          disabled
          className="w-full py-3.5 bg-primary/30 text-primary-foreground/50 rounded-full font-medium text-base cursor-not-allowed select-none"
        >
          Pay ${link.price.toFixed(2)} · Get instant access
        </button>

        {/* Trust row */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {[
            { icon: Timer, label: "Instant access" },
            { icon: LockKeyhole, label: "Stripe-secured" },
            { icon: Mail, label: "No account" },
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

export default async function PreviewPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const service = createServiceClient();
  const { data: link } = await service
    .from(TABLES.PRODUCTS)
    .select(
      "id, title, subtitle, description, includes, faq, price, currency, seller_id, status, preview_image_url, total_sales, expires_at, max_orders, slug, sellers!inner(name, username, bio, avatar_url, twitter_handle, website_url)",
    )
    .eq("id", id)
    .single();

  if (!link) notFound();
  if (link.seller_id !== user.id) notFound();

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  const seller = link.sellers as any;

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
  const username = seller?.username ?? "";

  // biome-ignore lint/suspicious/noExplicitAny: JSONB from Supabase
  const faqItems = (link.faq as Array<{ q: string; a: string }> | null) ?? [];
  const includesItems = (link.includes as string[] | null) ?? [];

  return (
    <main className="min-h-dvh bg-background pb-24 lg:pb-0">

      {/* Preview banner — sticky at very top */}
      <div className="sticky top-0 z-30 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Preview mode</span>
          </div>
          <Link
            href={`/dashboard/links/${link.id}`}
            className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors no-underline shrink-0 font-medium"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Nav — mirrors paywall page */}
      <nav className="sticky top-10 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/"
            className="text-sm font-medium text-foreground hover:opacity-70 transition-opacity"
          >
            unseal.link
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-12 lg:items-start">

          {/* Left column */}
          <div className="space-y-8">

            {/* Title + subtitle */}
            <div>
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

            {/* Description */}
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
                    title: "Enter your email and pay once",
                    desc: "Card, Apple Pay, or Google Pay via Stripe. No account needed — just your email for delivery.",
                    badge: null,
                  },
                  {
                    icon: Mail,
                    title: "Your access link arrives in seconds",
                    desc: "A one-time unlock link sent to your inbox. Usually there before you switch tabs.",
                    badge: "Under 30 sec",
                  },
                  {
                    icon: LockKeyhole,
                    title: "Click once, access immediately",
                    desc: "One click and you're in. No login, no password, no waiting.",
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
                  <p className="text-sm font-medium text-foreground">
                    {seller?.name ?? username}
                  </p>
                  {seller?.bio && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                      {seller.bio}
                    </p>
                  )}
                  {(seller?.twitter_handle || seller?.website_url) && (
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {seller.twitter_handle && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          @{seller.twitter_handle}
                          <ArrowUpRight className="size-3" aria-hidden="true" />
                        </span>
                      )}
                      {seller.website_url && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          Website
                          <ArrowUpRight className="size-3" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pb-4">
              <p className="text-[11px] text-muted-foreground">
                Payments by{" "}
                <span className="font-medium text-foreground">Stripe</span>
              </p>
            </div>
          </div>

          {/* Right column: sticky purchase card (desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <PreviewPurchaseCard
                link={link}
                expiresAt={expiresAt}
                salesCount={salesCount}
                formatTimeUntil={formatTimeUntil}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Mobile sticky bottom bar — disabled */}
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
            <button
              type="button"
              disabled
              className="w-full py-3.5 bg-primary/30 text-primary-foreground/50 rounded-full font-medium text-base cursor-not-allowed select-none"
            >
              Pay ${link.price.toFixed(2)} · Get instant access
            </button>
          </div>
        </div>
      </div>

    </main>
  );
}
