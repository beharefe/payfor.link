"use server";

import { trackServer } from "@unseallink/lib/amplitude-server";
import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { calculateFee } from "@unseallink/lib/promotions/promotions-service";
import { stripe } from "@unseallink/lib/stripe";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type ActionResult = { error: string };

export async function createCheckoutSession(
  linkId: string,
): Promise<ActionResult | never> {
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, title, price, currency, slug, seller_id, version, status, expires_at, max_orders, total_sales")
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
    .select("stripe_account_id, stripe_charges_enabled, username")
    .eq("id", link.seller_id)
    .single();

  if (!seller?.stripe_charges_enabled || !seller.stripe_account_id) {
    return { error: "This product is not available for purchase" };
  }

  if (!seller.username) {
    return { error: "Seller account is not fully set up" };
  }

  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  const paywallUrl = `${appUrl}/@${seller.username}/${link.slug}`;

  // Calculate fee with any active promotions applied.
  // Reads DB fresh — never cache. Race condition risk on concurrent payments.
  const grossCents = Math.round(link.price * 100);
  const feeCalc = await calculateFee(link.seller_id, grossCents);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: link.currency,
          unit_amount: grossCents,
          product_data: { name: link.title },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeCalc.final_fee_cents,
      transfer_data: { destination: seller.stripe_account_id },
    },
    consent_collection: {
      terms_of_service: "required",
    },
    custom_text: {
      submit: {
        message: "Your access link will be sent to the email address above.",
      },
    },
    success_url: `${paywallUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: paywallUrl,
    metadata: {
      product_id: link.id,
      product_version: String(link.version),
      seller_id: link.seller_id,
      fee_cents: String(feeCalc.final_fee_cents),
      promotions_applied: JSON.stringify(feeCalc.promotions_applied),
    },
  });

  if (!session.url) {
    log.error("Stripe session missing URL", { link_id: linkId });
    return { error: "Could not start checkout" };
  }

  void trackServer({
    name: "Checkout Started",
    props: { link_id: link.id, slug: link.slug, price: link.price, currency: link.currency },
  });

  redirect(session.url);
}
