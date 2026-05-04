import { generateAccessToken } from "@unseallink/lib/access-token";
import { TABLES } from "@unseallink/lib/db";
import { sendBuyerAccessEmail, sendSaleNotificationEmail } from "@unseallink/lib/email";
import { EXPERIMENTAL_CRYPTO_ENABLED } from "@unseallink/lib/feature-flags";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { serializeError } from "@unseallink/lib/utils";
import { validateTransfer, type Amount } from "@solana/pay";
import { Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { NextResponse } from "next/server";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const CRYPTO_PLATFORM_FEE_PERCENT = 1;

export async function GET(request: Request) {
  if (!EXPERIMENTAL_CRYPTO_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const txSignature = searchParams.get("txSignature");
  const linkId = searchParams.get("linkId");
  const email = searchParams.get("email");
  const referenceStr = searchParams.get("reference");

  if (!txSignature || !linkId || !email || !referenceStr) {
    return NextResponse.json(
      { error: "txSignature, linkId, email, and reference are required" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: product } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, seller_id, destination_url, title, price, version, max_orders, total_sales")
    .eq("id", linkId)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Idempotency — return existing order without re-running order creation logic.
  const { data: existingOrder } = await supabase
    .from(TABLES.ORDERS)
    .select("id")
    .eq("crypto_transaction_id", txSignature)
    .maybeSingle();

  if (existingOrder) {
    return NextResponse.json({ status: "complete", orderId: existingOrder.id });
  }

  const { data: walletData } = await supabase
    .from(TABLES.SELLERS)
    .select("solana_wallet_address")
    .eq("id", product.seller_id)
    .maybeSingle();

  const sellerWallet = (walletData as { solana_wallet_address?: string | null } | null)
    ?.solana_wallet_address;

  if (!sellerWallet) {
    return NextResponse.json({ error: "Seller wallet not configured" }, { status: 400 });
  }

  const rpcUrl =
    process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  try {
    await validateTransfer(
      connection,
      txSignature,
      {
        recipient: new PublicKey(sellerWallet),
        // biome-ignore lint/suspicious/noExplicitAny: BigNumber type conflict between bignumber.js and @solana/pay's nested copy
        amount: new BigNumber(product.price) as unknown as Amount,
        splToken: USDC_MINT,
        reference: new PublicKey(referenceStr),
      },
      { commitment: "confirmed" },
    );
  } catch {
    // Transfer not confirmed yet — tell the client to keep polling.
    return NextResponse.json({ status: "pending" });
  }

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "unseal.link";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  try {
    const orderId = await finalizeSolanaOrder({
      txSignature,
      linkId,
      email: email.toLowerCase(),
      product,
      appUrl,
    });
    return NextResponse.json({ status: "complete", orderId });
  } catch (err) {
    log.error("solana_confirm: finalize error", { error: serializeError(err) });
    return NextResponse.json(
      { status: "error", message: "Failed to finalize order" },
      { status: 500 },
    );
  }
}

async function finalizeSolanaOrder(params: {
  txSignature: string;
  linkId: string;
  email: string;
  product: {
    id: string;
    seller_id: string;
    destination_url: string;
    title: string;
    price: number;
    version: number;
    max_orders: number | null;
    total_sales: number | null;
  };
  appUrl: string;
}): Promise<string> {
  const supabase = createServiceClient();
  const { txSignature, email, product, appUrl } = params;

  // Double-check idempotency inside the transaction to guard against races.
  const { data: existing } = await supabase
    .from(TABLES.ORDERS)
    .select("id")
    .eq("crypto_transaction_id", txSignature)
    .maybeSingle();
  if (existing) return existing.id;

  const platformFee = Math.round(product.price * CRYPTO_PLATFORM_FEE_PERCENT) / 100;

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
      crypto_transaction_id: txSignature,
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
    log.error("solana_confirm: buyer_access_email_failed", {
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
      log.error("solana_confirm: sale_notification_failed", {
        order_id: insertedOrder.id,
        error: serializeError(err),
      }),
    );
  }

  log.info("solana_confirm: order created", {
    order_id: insertedOrder.id,
    product_id: product.id,
    tx_signature: txSignature,
  });

  return insertedOrder.id;
}
