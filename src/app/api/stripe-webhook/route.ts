import { sendBuyerAccessEmail, sendSaleNotificationEmail } from "@unseallink/lib/email";
import { createBuyerToken } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { platformFeeCents, stripe } from "@unseallink/lib/stripe";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { serializeError } from "@unseallink/lib/utils";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

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
    log.error("Stripe webhook signature verification failed", {
      error: serializeError(err),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "unseal.link";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
        appUrl,
      );
    } else if (event.type === "account.updated") {
      await handleAccountUpdated(event.data.object as Stripe.Account);
    }
  } catch (err) {
    log.error("Stripe webhook handler error", {
      type: event.type,
      error: serializeError(err),
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  appUrl: string,
) {
  const supabase = createServiceClient();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) {
    log.error("checkout.session.completed: no payment_intent");
    return;
  }

  const { data: existing } = await supabase
    .from(TABLES.ORDERS)
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
    .from(TABLES.PRODUCTS)
    .select(
      "id, seller_id, destination_url, title, price, version, total_sales, total_revenue",
    )
    .eq("id", productId)
    .single();
  if (!product) {
    log.error("checkout.session.completed: product not found", {
      product_id: productId,
    });
    return;
  }

  const rawEmail = session.customer_email ?? session.customer_details?.email;
  if (!rawEmail) {
    log.error("checkout.session.completed: no customer email");
    return;
  }
  // Normalize to lowercase so all downstream queries and session comparisons are consistent.
  const customerEmail = rawEmail.toLowerCase();

  const amountTotal = session.amount_total ?? 0;
  const pricePaid = amountTotal / 100;
  const platformFee = platformFeeCents(pricePaid) / 100;

  const { data: insertedOrder, error: insertError } = await supabase
    .from(TABLES.ORDERS)
    .insert({
      product_id: product.id,
      seller_id: product.seller_id,
      buyer_email: customerEmail,
      buyer_email_verified: true,
      stripe_payment_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
      delivery_url: product.destination_url,
      product_title: product.title,
      price_paid: pricePaid,
      platform_fee: platformFee,
      product_version: product.version,
      currency: (session.currency ?? "usd").toLowerCase(),
    })
    .select("id")
    .single();

  if (insertError || !insertedOrder) {
    log.error("checkout.session.completed: insert order failed", {
      error: insertError?.message,
    });
    return;
  }

  // Atomic increments via RPC — avoids read-modify-write races on concurrent orders.
  await Promise.all([
    supabase.rpc("increment_product_stats", {
      p_product_id: product.id,
      p_revenue: pricePaid,
    }),
    supabase.rpc("increment_seller_stats", {
      p_seller_id: product.seller_id,
      p_earned: pricePaid,
      p_fees: platformFee,
    }),
  ]);

  // Send buyer a signed access link — no Supabase session involved
  const accessLink = `${appUrl}/api/orders/verify?token=${createBuyerToken(customerEmail)}&oid=${insertedOrder.id}`;
  await sendBuyerAccessEmail({
    to: customerEmail,
    accessLink,
    productTitle: product.title,
    orderUrl: `${appUrl}/orders/${insertedOrder.id}`,
  });

  // Notify seller of the new sale
  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("email, name")
    .eq("id", product.seller_id)
    .maybeSingle();

  if (seller?.email) {
    await sendSaleNotificationEmail({
      to: seller.email,
      sellerName: seller.name ?? "",
      productTitle: product.title,
      pricePaid,
      platformFee,
      dashboardUrl: `${appUrl}/dashboard`,
    });
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createServiceClient();
  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("id, stripe_payouts_enabled")
    .eq("stripe_account_id", account.id)
    .single();
  if (!seller) return;

  await supabase
    .from(TABLES.SELLERS)
    .update({
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_details_submitted: account.details_submitted ?? false,
    })
    .eq("id", seller.id);
}
