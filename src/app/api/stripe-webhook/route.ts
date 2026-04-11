import { sendBuyerAccessEmail, sendDisputeAlert, sendSaleNotificationEmail } from "@unseallink/lib/email";
import { generateAccessToken } from "@unseallink/lib/access-token";
import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { recordPaymentUsage, reversePaymentUsage } from "@unseallink/lib/promotions/promotions-service";
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
    } else if (event.type === "charge.dispute.created") {
      await handleDisputeCreated(event.data.object as Stripe.Dispute);
    } else if (event.type === "charge.refunded") {
      await handleChargeRefunded(event.data.object as Stripe.Charge);
    } else {
      log.warn("Stripe webhook: unhandled event type", { type: event.type });
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
  // Use the fee that was actually set at checkout time (stored in metadata after promotion calc).
  // Fall back to base-rate calculation for sessions created before promotions were deployed.
  const feeCentsFromMeta = session.metadata?.fee_cents
    ? Number(session.metadata.fee_cents)
    : null;
  const platformFee =
    feeCentsFromMeta !== null ? feeCentsFromMeta / 100 : platformFeeCents(pricePaid) / 100;

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

  // Record promotion usage if any promotions were applied at checkout.
  const sellerId = session.metadata?.seller_id ?? product.seller_id;
  const promotionsApplied = session.metadata?.promotions_applied
    ? (() => {
        try {
          return JSON.parse(session.metadata.promotions_applied);
        } catch {
          return [];
        }
      })()
    : [];

  if (promotionsApplied.length > 0 && feeCentsFromMeta !== null) {
    await recordPaymentUsage({
      sellerId,
      stripePaymentIntentId: paymentIntentId,
      grossAmountCents: amountTotal,
      feeCalculation: {
        original_fee_cents: platformFeeCents(pricePaid),
        final_fee_cents: feeCentsFromMeta,
        savings_cents: platformFeeCents(pricePaid) - feeCentsFromMeta,
        promotions_applied: promotionsApplied,
      },
    }).catch((err) =>
      log.error("record_payment_usage_failed", {
        order_id: insertedOrder.id,
        error: serializeError(err),
      }),
    );
  }

  // Generate a single-use access token and store its hash in DB
  const { raw, hash, expiresAt } = generateAccessToken();
  await supabase.from(TABLES.ACCESS_TOKENS).insert({
    order_id: insertedOrder.id,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
  });
  // Link goes to confirmation page — token is NOT consumed on GET (prevents email-scanner pre-click)
  const accessLink = `${appUrl}/orders/access?t=${raw}&oid=${insertedOrder.id}`;
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

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;

  if (!paymentIntentId || !charge.amount_refunded) return;

  await reversePaymentUsage({
    stripePaymentIntentId: paymentIntentId,
    refundedAmountCents: charge.amount_refunded,
  }).catch((err) =>
    log.error("reverse_payment_usage_failed", {
      payment_intent: paymentIntentId,
      error: serializeError(err),
    }),
  );
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const supabase = createServiceClient();

  const paymentIntentId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id ?? null;

  if (!paymentIntentId) {
    log.error("charge.dispute.created: no payment_intent on dispute", { dispute_id: dispute.id });
    return;
  }

  const { data: order } = await supabase
    .from(TABLES.ORDERS)
    .select("id, seller_id, buyer_email, product_title, price_paid, currency")
    .eq("stripe_payment_id", paymentIntentId)
    .single();

  if (!order) {
    log.error("charge.dispute.created: order not found", { payment_intent: paymentIntentId });
    return;
  }

  await supabase
    .from(TABLES.ORDERS)
    .update({ status: "disputed" })
    .eq("id", order.id);

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("email, name")
    .eq("id", order.seller_id)
    .single();

  const disputePayload = {
    orderId: order.id,
    productTitle: order.product_title,
    buyerEmail: order.buyer_email,
    amount: dispute.amount / 100,
    currency: dispute.currency,
    reason: dispute.reason,
    evidenceDueBy: dispute.evidence_details?.due_by ?? null,
  };

  // Alert admin
  await sendDisputeAlert({
    to: "info@unseal.link",
    ...disputePayload,
    sellerEmail: seller?.email ?? null,
  }).catch((err) => log.error("dispute_alert_admin_email_failed", { error: serializeError(err) }));

  // Notify seller
  if (seller?.email) {
    await sendDisputeAlert({
      to: seller.email,
      ...disputePayload,
      isSellerCopy: true,
      sellerName: seller.name ?? null,
    }).catch((err) => log.error("dispute_alert_seller_email_failed", { error: serializeError(err) }));
  }

  log.info("charge.dispute.created: handled", { order_id: order.id, dispute_id: dispute.id });
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createServiceClient();
  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("id, stripe_connected, stripe_payouts_enabled")
    .eq("stripe_account_id", account.id)
    .single();
  if (!seller) return;

  const chargesEnabled = account.charges_enabled ?? false;

  await supabase
    .from(TABLES.SELLERS)
    .update({
      // Mark as connected the moment Stripe enables charges — this is the
      // authoritative signal, not the return URL (which can be skipped).
      stripe_connected: chargesEnabled ? true : seller.stripe_connected,
      stripe_charges_enabled: chargesEnabled,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_details_submitted: account.details_submitted ?? false,
    })
    .eq("id", seller.id);

  // Activate all draft products the moment the seller can accept payments.
  if (chargesEnabled) {
    await supabase
      .from(TABLES.PRODUCTS)
      .update({ status: "active" })
      .eq("seller_id", seller.id)
      .eq("status", "draft");
  }
}
