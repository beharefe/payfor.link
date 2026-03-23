import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, platformFeeCents } from "@unseallink/lib/stripe";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { resend, FROM_EMAIL } from "@unseallink/lib/resend";
import { log } from "@unseallink/lib/logger";

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
    .from("orders")
    .select("id")
    .eq("stripe_payment_id", paymentIntentId)
    .maybeSingle();
  if (existing) return;

  const productId = session.metadata?.product_id;
  if (!productId) {
    log.error("checkout.session.completed: no product_id in metadata");
    return;
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, seller_id, destination_url, title, price, version, total_sales, total_revenue")
    .eq("id", productId)
    .single();
  if (!product) {
    log.error("checkout.session.completed: product not found", { product_id: productId });
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

  const { error: insertError } = await supabase.from("orders").insert({
    product_id: product.id,
    seller_id: product.seller_id,
    buyer_email: customerEmail,
    stripe_payment_id: paymentIntentId,
    stripe_checkout_session_id: session.id,
    delivery_url: product.destination_url,
    product_title: product.title,
    price_paid: pricePaid,
    platform_fee: platformFee,
    product_version: product.version,
    currency: (session.currency ?? "usd").toLowerCase(),
  });

  if (insertError) {
    log.error("checkout.session.completed: insert order failed", { error: insertError.message });
    return;
  }

  // Atomic increments via RPC — avoids read-modify-write races on concurrent orders.
  await Promise.all([
    supabase.rpc("increment_product_stats", { p_product_id: product.id, p_revenue: pricePaid }),
    supabase.rpc("increment_seller_stats", { p_seller_id: product.seller_id, p_earned: pricePaid, p_fees: platformFee }),
  ]);

  // Send OTP to buyer for email verification on the success page
  await supabase.auth.signInWithOtp({
    email: customerEmail,
    options: { shouldCreateUser: true },
  });

  // Notify seller of the new sale
  const { data: seller } = await supabase
    .from("sellers")
    .select("email, name")
    .eq("id", product.seller_id)
    .single();

  if (seller?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
    await resend.emails.send({
      from: FROM_EMAIL,
      to: seller.email,
      subject: `New sale — ${product.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="font-size:20px;font-weight:500;margin:0 0 8px;">You just made a sale 🎉</h2>
          <p style="font-size:16px;margin:0 0 4px;"><strong>${product.title}</strong></p>
          <p style="font-size:24px;font-weight:500;margin:0 0 20px;">$${pricePaid.toFixed(2)}</p>
          <a href="${appUrl}/dashboard" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:500;">
            View dashboard →
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:24px;">unseal.link · Platform fee: $${platformFee.toFixed(2)} (4.5%)</p>
        </div>
      `,
    });
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createServiceClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, stripe_payouts_enabled")
    .eq("stripe_account_id", account.id)
    .single();
  if (!seller) return;

  const payoutsJustEnabled = !seller.stripe_payouts_enabled && account.payouts_enabled;

  await supabase
    .from("sellers")
    .update({
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_details_submitted: account.details_submitted ?? false,
    })
    .eq("id", seller.id);

  if (payoutsJustEnabled) {
    const { data: updated } = await supabase.from("sellers").select("email").eq("id", seller.id).single();
    if (updated?.email) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: updated.email,
        subject: "You can now withdraw your earnings",
        html: "<p>Identity verification is complete. You can now withdraw your earnings from the dashboard.</p>",
      });
    }
  }
}
