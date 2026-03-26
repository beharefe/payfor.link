import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
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
    .eq("sellers.name", username)
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
    .eq("sellers.name", username)
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

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  const seller = link.sellers as any;
  log.info("paywall_viewed", { link_id: link.id, slug, username });

  const salesCount = link.total_sales ?? 0;

  return (
    <main className="max-w-sm mx-auto">
      {link.preview_image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-t-2xl bg-muted">
          <img
            src={link.preview_image_url}
            alt={link.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={`px-8 pb-8 ${link.preview_image_url ? "pt-6" : "pt-10"}`}>
        <p className="text-sm text-muted-foreground mb-2">
          by{" "}
          <Link
            href={`/@${username}`}
            className="hover:underline font-medium text-foreground"
          >
            @{username}
          </Link>
        </p>

        <h1 className="text-2xl font-semibold mb-3">{link.title}</h1>

        {link.description && (
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {link.description}
          </p>
        )}

        <p className="text-3xl font-bold mb-4">
          ${link.price.toFixed(2)}{" "}
          <span className="text-base font-normal text-muted-foreground">
            {link.currency.toUpperCase()}
          </span>
        </p>

        <PaywallCTA linkId={link.id} />

        <div className="mt-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">✓ Secure payment via Stripe</p>
          <p className="text-xs text-muted-foreground">✓ Instant delivery after payment</p>
          {salesCount > 0 && (
            <p className="text-xs text-muted-foreground">✓ {salesCount} purchases</p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <AbuseReportForm productId={link.id} />
        </div>
      </div>
    </main>
  );
}
