"use server";

import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { platformFeeCents, stripe } from "@unseallink/lib/stripe";
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
    .select("id, title, price, currency, slug, seller_id, version, status, expires_at")
    .eq("id", linkId)
    .eq("status", "active")
    .single();

  if (!link) return { error: "This product is no longer available" };

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { error: "This offer has expired" };
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: link.currency,
          unit_amount: Math.round(link.price * 100),
          product_data: { name: link.title },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeCents(link.price),
      transfer_data: { destination: seller.stripe_account_id },
    },
    consent_collection: {
      terms_of_service: "required",
    },
    custom_text: {
      after_submit: {
        message: "By completing this purchase you agree to our [Terms of Service](https://unseal.link/terms) and [Privacy Policy](https://unseal.link/privacy).",
      },
    },
    success_url: `${paywallUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: paywallUrl,
    metadata: {
      product_id: link.id,
      product_version: String(link.version),
    },
  });

  if (!session.url) {
    log.error("Stripe session missing URL", { link_id: linkId });
    return { error: "Could not start checkout" };
  }

  redirect(session.url);
}
