import { createClient, createServiceClient } from "@unseallink/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createCheckoutSession } from "@unseallink/app/actions/checkout";
import { log } from "@unseallink/lib/logger";
import { PaywallCTA } from "./paywall-cta";
import { AbuseReportForm } from "./abuse-report-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("links")
    .select("title, description, price, preview_image_url")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!link) return { title: "Not found" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
  const title = `${link.title} — $${link.price}`;
  const description = link.description ?? "Pay once and get instant access.";

  return {
    title,
    description,
    metadataBase: new URL(appUrl),
    openGraph: {
      title,
      description,
      url: `${appUrl}/pay/${slug}`,
      images: link.preview_image_url ? [{ url: link.preview_image_url }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    other: {
      "product:price:amount": String(link.price),
      "product:price:currency": "USD",
    },
  };
}

export default async function PaywallPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("links")
    .select("id, title, description, price, currency, seller_id, status")
    .eq("slug", slug)
    .single();

  if (!link) notFound();
  if (link.status !== "active") {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Unavailable</h1>
        <p>This product is not available for purchase.</p>
      </main>
    );
  }

  const service = createServiceClient();
  const { data: seller } = await service
    .from("users")
    .select("name, email")
    .eq("id", link.seller_id)
    .single();

  log.info("paywall_viewed", { link_id: link.id, slug });

  return (
    <main style={{ padding: "2rem", maxWidth: "28rem", margin: "0 auto" }}>
      <h1>{link.title}</h1>
      {seller?.name && (
        <p style={{ color: "#666" }}>
          by {seller.name}
        </p>
      )}
      {link.description && <p>{link.description}</p>}
      <p>
        <strong>${link.price.toFixed(2)}</strong> {link.currency.toUpperCase()}
      </p>
      <PaywallCTA linkId={link.id} />
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <AbuseReportForm linkId={link.id} />
      </div>
    </main>
  );
}
