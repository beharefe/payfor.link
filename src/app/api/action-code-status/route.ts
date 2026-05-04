import { generateAccessToken } from "@unseallink/lib/access-token";
import { getActionCodesClient } from "@unseallink/lib/action-codes";
import { TABLES } from "@unseallink/lib/db";
import { sendBuyerAccessEmail, sendSaleNotificationEmail } from "@unseallink/lib/email";
import { EXPERIMENTAL_CRYPTO_ENABLED } from "@unseallink/lib/feature-flags";
import { PLATFORM_FEE_BPS } from "@unseallink/lib/solana-tx";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { serializeError } from "@unseallink/lib/utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!EXPERIMENTAL_CRYPTO_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const linkId = searchParams.get("linkId");
  const email = searchParams.get("email");

  if (!code || !linkId || !email) {
    return NextResponse.json(
      { error: "code, linkId, and email are required" },
      { status: 400 },
    );
  }

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "unseal.link";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  const client = getActionCodesClient();

  let resolved: Awaited<ReturnType<typeof client.relay.resolve>>;
  try {
    resolved = await client.relay.resolve("solana", code);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isExpired =
      msg.toLowerCase().includes("expired") ||
      msg.toLowerCase().includes("not found");
    return NextResponse.json(
      { status: isExpired ? "expired" : "error", message: msg },
      { status: 200 },
    );
  }

  const data = resolved.data;

  if (!data || data.mode !== "sign-and-execute-transaction") {
    // Code resolved but no transaction attached yet, or still pending
    return NextResponse.json({ status: "waiting" });
  }

  // Transaction was attached — check if it finalized
  if (!("txHash" in data)) {
    return NextResponse.json({ status: "waiting" });
  }

  const txHash = (data as { txHash: string }).txHash;

  try {
    const orderId = await finalizeActionCodeOrder({
      txHash,
      linkId,
      email: email.toLowerCase(),
      appUrl,
    });
    return NextResponse.json({ status: "complete", orderId });
  } catch (err) {
    log.error("action_code_status: finalize error", { error: serializeError(err) });
    return NextResponse.json(
      { status: "error", message: "Failed to finalize order" },
      { status: 500 },
    );
  }
}

async function finalizeActionCodeOrder(params: {
  txHash: string;
  linkId: string;
  email: string;
  appUrl: string;
}): Promise<string> {
  const supabase = createServiceClient();
  const { txHash, linkId, email, appUrl } = params;

  // Idempotency — return existing order if already processed
  const { data: existingOrder } = await supabase
    .from(TABLES.ORDERS)
    .select("id")
    .eq("crypto_transaction_id", txHash)
    .maybeSingle();
  if (existingOrder) return existingOrder.id;

  const { data: product } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, seller_id, destination_url, title, price, version, max_orders, total_sales")
    .eq("id", linkId)
    .single();

  if (!product) throw new Error(`Product not found: ${linkId}`);

  const platformFee = Math.round(product.price * PLATFORM_FEE_BPS) / 10_000;

  const { data: insertedOrder, error: insertError } = await supabase
    .from(TABLES.ORDERS)
    .insert({
      product_id: product.id,
      seller_id: product.seller_id,
      buyer_email: email,
      buyer_email_verified: true,
      delivery_url: product.destination_url,
      product_title: product.title,
      price_paid: product.price,
      platform_fee: platformFee,
      product_version: product.version,
      currency: "usd",
      payment_processor: "solana",
      crypto_transaction_id: txHash,
    })
    .select("id")
    .single();

  if (insertError || !insertedOrder) {
    throw new Error(`Order insert failed: ${insertError?.message ?? "no data"}`);
  }

  const { data: slotClaimed } = await supabase.rpc("try_increment_product_stats", {
    p_product_id: product.id,
    p_revenue: product.price,
  });

  if (slotClaimed === false) {
    await supabase
      .from(TABLES.ORDERS)
      .update({
        status: "refunded",
        refund_reason: "sold_out",
        refunded_at: new Date().toISOString(),
      })
      .eq("id", insertedOrder.id);
    throw new Error("sold_out");
  }

  await supabase.rpc("increment_seller_stats", {
    p_seller_id: product.seller_id,
    p_earned: product.price,
    p_fees: platformFee,
  });

  const { raw, hash, expiresAt } = generateAccessToken();
  await supabase.from(TABLES.ACCESS_TOKENS).insert({
    order_id: insertedOrder.id,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
  });

  const accessLink = `${appUrl}/orders/access?t=${raw}&oid=${insertedOrder.id}`;

  sendBuyerAccessEmail({
    to: email,
    accessLink,
    productTitle: product.title,
    orderUrl: `${appUrl}/orders/${insertedOrder.id}`,
  }).catch((err) =>
    log.error("action_code_status: buyer_access_email_failed", {
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
      log.error("action_code_status: sale_notification_failed", {
        order_id: insertedOrder.id,
        error: serializeError(err),
      }),
    );
  }

  log.info("action_code_status: order created", {
    order_id: insertedOrder.id,
    product_id: product.id,
    tx_hash: txHash,
  });

  return insertedOrder.id;
}
