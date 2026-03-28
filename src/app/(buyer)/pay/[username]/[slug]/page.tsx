import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { LockKeyhole, Mail, ShieldCheck, Timer, Users } from "lucide-react";
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
    .eq("status", "active")
    .eq("sellers.username", username)
    .single();

  if (!link) return { title: "Not found" };

  const baseUrl = await getBaseUrl();
  const title = `${link.title} — $${link.price}`;
  const description = link.description ?? "Pay once and get instant access.";

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      url: `${baseUrl}/@${username}/${slug}`,
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
      "id, title, description, price, currency, seller_id, status, preview_image_url, total_sales, sellers!inner(name, username)",
    )
    .eq("slug", slug)
    .eq("sellers.username", username)
    .single();

  if (!link) notFound();
  if (link.status !== "active") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground mb-2">Unavailable</h1>
          <p className="text-muted-foreground text-sm">This product is not available for purchase.</p>
        </div>
      </main>
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  const seller = link.sellers as any;
  log.info("paywall_viewed", { link_id: link.id, slug, username });

  const salesCount = link.total_sales ?? 0;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        {/* Seller header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium text-foreground shrink-0">
            {(seller?.name ?? username).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">
              @{username}
            </p>
            <p className="text-xs text-muted-foreground">is selling this</p>
          </div>
        </div>

        {link.preview_image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted mb-4">
            <img
              src={link.preview_image_url}
              alt={link.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="border border-border rounded-2xl bg-card p-6">
          <h1 className="text-xl font-medium tracking-tight text-foreground mb-2">{link.title}</h1>

          {link.description && (
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {link.description}
            </p>
          )}

          <div className="flex items-baseline gap-2 mb-5">
            <p className="text-3xl font-medium text-foreground">
              ${link.price.toFixed(2)}
            </p>
            <span className="text-sm text-muted-foreground">
              {link.currency.toUpperCase()} · one-time
            </span>
          </div>

          <PaywallCTA linkId={link.id} />

          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Secure payment via Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Access link sent to your email instantly</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Timer className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Link expires in 24 hours</span>
            </div>
            {salesCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{salesCount} {salesCount === 1 ? "sale" : "sales"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Trust footer */}
        <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
          <ShieldCheck className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          <p className="text-center text-xs text-muted-foreground">
            Powered by{" "}
            <Link href="/" className="hover:underline text-foreground">
              unseal.link
            </Link>
            {" "}· Safe Browsing checked · Refund available if needed
          </p>
        </div>

        <div className="mt-4 text-center">
          <AbuseReportForm productId={link.id} />
        </div>
      </div>
    </main>
  );
}
