import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { Clock, Eye, LockKeyhole, Mail, Timer } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
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

export default async function PreviewPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth`);

  const service = createServiceClient();
  const { data: link } = await service
    .from(TABLES.PRODUCTS)
    .select(
      "id, title, description, price, currency, seller_id, status, preview_image_url, total_sales, expires_at, slug, sellers!inner(name, username)",
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
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  const salesCount = link.total_sales ?? 0;

  return (
    <main className="min-h-dvh bg-background flex flex-col items-center px-6 py-8">
      {/* Preview banner */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-muted border border-border">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Preview mode</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              link.status === "active"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-muted text-muted-foreground border border-border"
            }`}>
              {link.status}
            </span>
            <Link
              href={`/dashboard/links/${link.id}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              Edit →
            </Link>
          </div>
        </div>
      </div>

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
          <div>
            {expiresAt && !isExpired && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium cursor-default">
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
            className="w-full py-3.5 bg-primary/30 text-primary-foreground/50 rounded-full font-medium text-base cursor-not-allowed"
          >
            Pay ${link.price.toFixed(2)} · Get instant access
          </button>

          {/* Trust row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { icon: LockKeyhole, label: "Secure" },
              { icon: Mail, label: "By email" },
              { icon: Timer, label: "Instant" },
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
              {(seller?.name ?? seller?.username ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-0.5">Sold by</p>
              <p className="text-sm font-medium text-foreground">
                {seller?.name ?? seller?.username}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">unseal.link</span>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-1">
          This is how your link looks to buyers. The payment button is disabled in preview.
        </p>
      </div>
    </main>
  );
}
