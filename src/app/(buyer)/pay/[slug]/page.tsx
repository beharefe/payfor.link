import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AbuseReportForm } from "./abuse-report-form";
import { PaywallCTA } from "./paywall-cta";

type Props = { params: Promise<{ slug: string }> };

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
  const title = `${link.title} — $${link.price}`;
  const description = link.description ?? "Pay once and get instant access.";
  const ogImage = link.preview_image_url ?? `${appUrl}/api/og/${slug}`;

  return {
    title,
    description,
    metadataBase: new URL(appUrl),
    openGraph: {
      title,
      description,
      url: `${appUrl}/pay/${slug}`,
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

  return (
    <main className="max-w-sm mx-auto">
      {/* Preview image */}
      {link.preview_image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-t-2xl bg-muted">
          <img
            src={link.preview_image_url}
            alt={link.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={`p-8 ${link.preview_image_url ? "" : "pt-8"}`}>
        {/* Seller */}
        {seller?.name && (
          <p className="text-sm text-muted-foreground mb-3">
            by{" "}
            {seller.username ? (
              <Link href={`/s/${seller.username}`} className="hover:underline font-medium text-foreground">
                {seller.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{seller.name}</span>
            )}
          </p>
        )}

        <h1 className="text-2xl font-semibold mb-3">{link.title}</h1>

        {link.description && (
          <p className="text-muted-foreground mb-4">{link.description}</p>
        )}

        {/* Price + social proof */}
        <div className="flex items-baseline gap-3 mb-6">
          <p className="text-2xl font-bold">
            ${link.price.toFixed(2)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {link.currency.toUpperCase()}
            </span>
          </p>
          {(link.total_sales ?? 0) > 0 && (
            <p className="text-sm text-muted-foreground">
              {link.total_sales} purchases
            </p>
          )}
        </div>

        <PaywallCTA linkId={link.id} />

        <div className="mt-8 text-center">
          <AbuseReportForm productId={link.id} />
        </div>
      </div>
    </main>
  );
}
