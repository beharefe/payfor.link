"use server";

import { TABLES } from "@unseallink/lib/db";
import { EXPERIMENTAL_CRYPTO_ENABLED } from "@unseallink/lib/feature-flags";
import { createHelioPayLink } from "@unseallink/lib/helio";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

type ActionResult = { error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createCryptoCheckout(
  linkId: string,
  buyerEmail: string,
): Promise<ActionResult | never> {
  if (!EXPERIMENTAL_CRYPTO_ENABLED) return { error: "Crypto payments are not enabled" };

  const email = buyerEmail.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return { error: "A valid email address is required" };

  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, title, price, status, expires_at, max_orders, total_sales, seller_id, version")
    .eq("id", linkId)
    .eq("status", "active")
    .single();

  if (!link) return { error: "This product is no longer available" };

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { error: "This offer has expired" };
  }

  if (link.max_orders !== null && link.max_orders !== undefined && (link.total_sales ?? 0) >= link.max_orders) {
    return { error: "This product is sold out" };
  }

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("stripe_charges_enabled, solana_wallet_address")
    .eq("id", link.seller_id)
    .single();

  // Sellers must have completed Stripe KYC before accepting crypto payments.
  // This ensures identity verification regardless of payment method.
  if (!seller?.stripe_charges_enabled) {
    return { error: "This product is not available for purchase" };
  }

  if (!seller.solana_wallet_address) {
    return { error: "This seller has not enabled crypto payments" };
  }

  let helioPayLink: { id: string; checkoutUrl: string };
  try {
    helioPayLink = await createHelioPayLink({
      productTitle: link.title,
      priceUsd: link.price,
      sellerWalletAddress: seller.solana_wallet_address,
    });
  } catch (err) {
    log.error("crypto_checkout: helio_paylink_creation_failed", {
      link_id: linkId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { error: "Could not start crypto checkout. Please try again." };
  }

  // Store the pay link → product/buyer mapping for the webhook handler.
  // Helio's CreatePaylinkDto has no metadata field, so we keep context server-side.
  const { error: insertError } = await supabase
    .from(TABLES.PENDING_CRYPTO_CHECKOUTS)
    .insert({
      helio_paylink_id: helioPayLink.id,
      product_id: link.id,
      buyer_email: email,
    });

  if (insertError) {
    log.error("crypto_checkout: pending_checkout_insert_failed", {
      link_id: linkId,
      error: insertError.message,
    });
    return { error: "Could not start crypto checkout. Please try again." };
  }

  redirect(helioPayLink.checkoutUrl);
}
