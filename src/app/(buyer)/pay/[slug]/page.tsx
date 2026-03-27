import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AbuseReportForm } from "../abuse-report-form";
import { PaywallCTA } from "../paywall-cta";

type Props = { params: Promise<{ slug: string }> };

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select("title, description, price, preview_image_url")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!link) return { title: "Not found" };

  const baseUrl = await getBaseUrl();
  const title = `${link.title} — $${link.price}`;
  const description = link.description ?? "Pay once and get instant access.";
  // Always use the dynamic OG route — it handles preview_image_url internally
  const ogImage = `${baseUrl}/api/og/${slug}`;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      url: `${baseUrl}/pay/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "product:price:amount": String(link.price),
      "product:price:currency": "USD",
    },
  };
}

export default async function PaywallPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, title, description, price, currency, seller_id, status, preview_image_url, total_sales")
    .eq("slug", slug)
    .single();

  if (!link) notFound();
  if (link.status !== "active") {
    return (
      <main className="p-8 text-center">
        <h1>Unavailable</h1>
        <p>This product is not available for purchase.</p>
      </main>
    );
  }

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name, username")
    .eq("id", link.seller_id)
    .single();

  log.info("paywall_viewed", { link_id: link.id, slug });

  const salesCount = link.total_sales ?? 0;
  const sellerName = seller?.name ?? null;
  const sellerProfileHref = seller?.username ? `/@${seller.username}` : null;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        {/* Preview image */}
        {link.preview_image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted mb-6">
            <img
              src={link.preview_image_url}
              alt={link.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="border border-border rounded-2xl bg-card p-6">
          {/* Seller */}
          {sellerName && (
            <p className="text-xs text-muted-foreground mb-4">
              by{" "}
              {sellerProfileHref ? (
                <Link href={sellerProfileHref} className="hover:underline font-medium text-foreground">
                  {sellerName}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{sellerName}</span>
              )}
            </p>
          )}

          {/* Title */}
          <h1 className="text-xl font-medium tracking-tight text-foreground mb-2">{link.title}</h1>

          {/* Description */}
          {link.description && (
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{link.description}</p>
          )}

          {/* Price */}
          <p className="text-3xl font-medium text-foreground mb-5">
            ${link.price.toFixed(2)}{" "}
            <span className="text-base font-normal text-muted-foreground">
              {link.currency.toUpperCase()}
            </span>
          </p>

          {/* CTA */}
          <PaywallCTA linkId={link.id} />

          {/* Trust signals */}
          <div className="mt-4 flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">✓ Secure payment via Stripe</p>
            <p className="text-xs text-muted-foreground">✓ Instant delivery by email</p>
            {salesCount > 0 && (
              <p className="text-xs text-muted-foreground">✓ {salesCount} purchases</p>
            )}
          </div>
        </div>

        {/* Report abuse */}
        <div className="mt-6 text-center">
          <AbuseReportForm productId={link.id} />
        </div>
      </div>
    </main>
  );
}
