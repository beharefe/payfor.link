import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, platformFeeCents } from "@payforlink/lib/stripe";
import { createServiceClient } from "@payforlink/lib/supabase/server";
import { resend, FROM_EMAIL } from "@payforlink/lib/resend";
import { log } from "@payforlink/lib/logger";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    log.error("Stripe webhook: STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let body: string;
  let signature: string | null;
  try {
    body = await request.text();
    signature = request.headers.get("stripe-signature");
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    log.error("Stripe webhook signature verification failed", { error: String(err) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "account.updated") {
      await handleAccountUpdated(event.data.object as Stripe.Account);
    }
  } catch (err) {
    log.error("Stripe webhook handler error", { type: event.type, error: String(err) });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) {
    log.error("checkout.session.completed: no payment_intent");
    return;
  }

  const { data: existing } = await supabase
    .from("purchases")
    .select("id")
    .eq("stripe_payment_id", paymentIntentId)
    .maybeSingle();
  if (existing) return;

  const linkId = session.metadata?.link_id;
  if (!linkId) {
    log.error("checkout.session.completed: no link_id in metadata");
    return;
  }

  const { data: link } = await supabase
    .from("links")
    .select("id, seller_id, destination_url, title, price, version, total_sales, total_revenue")
    .eq("id", linkId)
    .single();
  if (!link) {
    log.error("checkout.session.completed: link not found", { link_id: linkId });
    return;
  }

  const customerEmail = session.customer_email ?? session.customer_details?.email;
  if (!customerEmail) {
    log.error("checkout.session.completed: no customer email");
    return;
  }

  const amountTotal = session.amount_total ?? 0;
  const pricePaid = amountTotal / 100;
  const platformFee = platformFeeCents(pricePaid) / 100;

  const { error: insertError } = await supabase.from("purchases").insert({
    link_id: link.id,
    seller_id: link.seller_id,
    buyer_email: customerEmail,
    stripe_payment_id: paymentIntentId,
    stripe_checkout_session_id: session.id,
    delivery_url: link.destination_url,
    product_title: link.title,
    price_paid: pricePaid,
    platform_fee: platformFee,
    link_version: link.version,
    currency: (session.currency ?? "usd").toLowerCase(),
  });

  if (insertError) {
    log.error("checkout.session.completed: insert purchase failed", { error: insertError.message });
    return;
  }

  // Atomic increments via RPC — avoids read-modify-write races on concurrent purchases.
  await Promise.all([
    supabase.rpc("increment_link_stats", { p_link_id: link.id, p_revenue: pricePaid }),
    supabase.rpc("increment_seller_stats", { p_seller_id: link.seller_id, p_earned: pricePaid, p_fees: platformFee }),
  ]);

  await supabase.auth.signInWithOtp({
    email: customerEmail,
    options: { shouldCreateUser: true },
  });
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, stripe_payouts_enabled")
    .eq("stripe_account_id", account.id)
    .single();
  if (!user) return;

  const payoutsJustEnabled = !user.stripe_payouts_enabled && account.payouts_enabled;

  await supabase
    .from("users")
    .update({
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_details_submitted: account.details_submitted ?? false,
    })
    .eq("id", user.id);

  if (payoutsJustEnabled) {
    const { data: seller } = await supabase.from("users").select("email").eq("id", user.id).single();
    if (seller?.email) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: seller.email,
        subject: "You can now withdraw your earnings",
        html: "<p>Identity verification is complete. You can now withdraw your earnings from the dashboard.</p>",
      });
    }
  }
}
