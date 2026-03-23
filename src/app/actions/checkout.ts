"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@unseallink/lib/supabase/server";
import { stripe, platformFeeCents } from "@unseallink/lib/stripe";
import { log } from "@unseallink/lib/logger";

type ActionResult = { error: string };

export async function createCheckoutSession(
  linkId: string,
): Promise<ActionResult | never> {
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("links")
    .select("id, title, price, currency, slug, seller_id, version, status")
    .eq("id", linkId)
    .eq("status", "active")
    .single();

  if (!link) return { error: "This product is no longer available" };

  const service = createServiceClient();
  const { data: seller } = await service
    .from("users")
    .select("stripe_account_id, stripe_charges_enabled")
    .eq("id", link.seller_id)
    .single();

  if (!seller?.stripe_charges_enabled || !seller.stripe_account_id) {
    return { error: "This product is not available for purchase" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set");

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
    success_url: `${appUrl}/pay/${link.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pay/${link.slug}`,
    metadata: {
      link_id: link.id,
      link_version: String(link.version),
    },
  });

  if (!session.url) {
    log.error("Stripe session missing URL", { link_id: linkId });
    return { error: "Could not start checkout" };
  }

  redirect(session.url);
}
