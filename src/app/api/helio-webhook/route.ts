import { generateAccessToken } from "@unseallink/lib/access-token";
import { TABLES } from "@unseallink/lib/db";
import { sendBuyerAccessEmail, sendSaleNotificationEmail } from "@unseallink/lib/email";
import { EXPERIMENTAL_CRYPTO_ENABLED } from "@unseallink/lib/feature-flags";
import {
  CRYPTO_PLATFORM_FEE_PERCENT,
  type HelioWebhookPayload,
  extractPaylinkId,
  extractTransactionId,
  verifyHelioWebhookSignature,
} from "@unseallink/lib/helio";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { serializeError } from "@unseallink/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!EXPERIMENTAL_CRYPTO_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const xSignature = request.headers.get("x-signature") ?? "";

  if (!verifyHelioWebhookSignature({ rawBody, xSignature, authorizationHeader: authHeader })) {
    log.error("helio_webhook: signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: HelioWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as HelioWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "unseal.link";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  // Only process completed payments
  if (payload.event !== "CREATED") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    await handleHelioPaymentCreated(payload, appUrl);
  } catch (err) {
    log.error("helio_webhook: handler error", { error: serializeError(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleHelioPaymentCreated(
  payload: HelioWebhookPayload,
  appUrl: string,
) {
  const supabase = createServiceClient();

  const transactionId = extractTransactionId(payload);
  if (!transactionId) {
    log.error("helio_webhook: no transaction ID in payload", { payload });
    return;
  }

  // Idempotency: skip if we already processed this transaction
  const { data: existingOrder } = await supabase
    .from(TABLES.ORDERS)
    .select("id")
    .eq("crypto_transaction_id", transactionId)
    .maybeSingle();
  if (existingOrder) return;

  const paylinkId = extractPaylinkId(payload);
  if (!paylinkId) {
    log.error("helio_webhook: no paylinkId in payload", { payload });
    return;
  }

  // Look up the pending checkout we stored when the buyer clicked "Pay with crypto"
  const { data: pending } = await supabase
    .from(TABLES.PENDING_CRYPTO_CHECKOUTS)
    .select("product_id, buyer_email, expires_at")
    .eq("helio_paylink_id", paylinkId)
    .maybeSingle();

  if (!pending) {
    log.error("helio_webhook: no pending checkout for paylinkId", { paylinkId });
    return;
  }

  if (new Date(pending.expires_at) < new Date()) {
    log.warn("helio_webhook: pending checkout expired", { paylinkId });
    return;
  }

  const { data: product } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, seller_id, destination_url, title, price, version, max_orders, total_sales")
    .eq("id", pending.product_id)
    .single();

  if (!product) {
    log.error("helio_webhook: product not found", { product_id: pending.product_id });
    return;
  }

  const buyerEmail = pending.buyer_email.toLowerCase();
  // Round to 2 decimal places — matches how Stripe stores fees
  const platformFee = Math.round(product.price * CRYPTO_PLATFORM_FEE_PERCENT) / 100;

  const { data: insertedOrder, error: insertError } = await supabase
    .from(TABLES.ORDERS)
    .insert({
      product_id: product.id,
      seller_id: product.seller_id,
      buyer_email: buyerEmail,
      buyer_email_verified: true,
      // Crypto orders never touch Stripe — stripe_payment_id stays null
      delivery_url: product.destination_url,
      product_title: product.title,
      price_paid: product.price,
      platform_fee: platformFee,
      product_version: product.version,
      currency: "usd",
      payment_processor: "helio",
      crypto_transaction_id: transactionId,
    })
    .select("id")
    .single();

  if (insertError || !insertedOrder) {
    throw new Error(`Crypto order insert failed: ${insertError?.message ?? "no data"}`);
  }

  // Atomic slot claim — enforces max_orders at DB level (same RPC as Stripe flow)
  const { data: slotClaimed } = await supabase.rpc("try_increment_product_stats", {
    p_product_id: product.id,
    p_revenue: product.price,
  });

  if (slotClaimed === false) {
    // Sold out race — mark the order, do NOT send access email.
    // Crypto refunds must be handled manually (no on-chain reversal in Phase 1).
    log.warn("helio_webhook: max_orders reached on crypto payment", {
      product_id: product.id,
      order_id: insertedOrder.id,
    });
    await supabase
      .from(TABLES.ORDERS)
      .update({ status: "refunded", refund_reason: "sold_out", refunded_at: new Date().toISOString() })
      .eq("id", insertedOrder.id);
    return;
  }

  await supabase.rpc("increment_seller_stats", {
    p_seller_id: product.seller_id,
    p_earned: product.price,
    p_fees: platformFee,
  });

  // Clean up the pending checkout record
  await supabase
    .from(TABLES.PENDING_CRYPTO_CHECKOUTS)
    .delete()
    .eq("helio_paylink_id", paylinkId);

  // Generate single-use access token (same mechanism as Stripe flow)
  const { raw, hash, expiresAt } = generateAccessToken();
  await supabase.from(TABLES.ACCESS_TOKENS).insert({
    order_id: insertedOrder.id,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
  });

  const accessLink = `${appUrl}/orders/access?t=${raw}&oid=${insertedOrder.id}`;

  sendBuyerAccessEmail({
    to: buyerEmail,
    accessLink,
    productTitle: product.title,
    orderUrl: `${appUrl}/orders/${insertedOrder.id}`,
  }).catch((err) =>
    log.error("helio_webhook: buyer_access_email_failed", {
      order_id: insertedOrder.id,
      error: serializeError(err),
    }),
  );

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("email, name")
    .eq("id", product.seller_id)
    .maybeSingle();

  if (seller?.email) {
    sendSaleNotificationEmail({
      to: seller.email,
      sellerName: seller.name ?? "",
      productTitle: product.title,
      pricePaid: product.price,
      platformFee: 0,
      dashboardUrl: `${appUrl}/dashboard`,
    }).catch((err) =>
      log.error("helio_webhook: sale_notification_email_failed", {
        order_id: insertedOrder.id,
        error: serializeError(err),
      }),
    );
  }

  log.info("helio_webhook: order created", {
    order_id: insertedOrder.id,
    product_id: product.id,
    transaction_id: transactionId,
  });
}
