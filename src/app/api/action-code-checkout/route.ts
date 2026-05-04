import { getActionCodesClient } from "@unseallink/lib/action-codes";
import { TABLES } from "@unseallink/lib/db";
import { EXPERIMENTAL_CRYPTO_ENABLED } from "@unseallink/lib/feature-flags";
import { log } from "@unseallink/lib/logger";
import { buildUsdcTransferTx } from "@unseallink/lib/solana-tx";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { serializeError } from "@unseallink/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!EXPERIMENTAL_CRYPTO_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { linkId?: string; email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { linkId, email, code } = body;
  if (!linkId || !email || !code) {
    return NextResponse.json(
      { error: "linkId, email, and code are required" },
      { status: 400 },
    );
  }

  if (!/^\d{8}$/.test(code)) {
    return NextResponse.json(
      { error: "Action code must be 8 digits" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: product } = await supabase
    .from(TABLES.PRODUCTS)
    .select(
      "id, seller_id, title, price, status, sellers!inner(solana_wallet_address, stripe_charges_enabled)",
    )
    .eq("id", linkId)
    .eq("status", "active")
    .single();

  if (!product) {
    return NextResponse.json(
      { error: "Product not found or unavailable" },
      { status: 404 },
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  const seller = product.sellers as any;
  if (!seller?.stripe_charges_enabled || !seller?.solana_wallet_address) {
    return NextResponse.json(
      { error: "Seller has not enabled crypto payments" },
      { status: 400 },
    );
  }

  const client = getActionCodesClient();

  let buyerPubkey: string;
  try {
    const resolved = await client.relay.resolve("solana", code);
    buyerPubkey = resolved.pubkey;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isExpired =
      msg.toLowerCase().includes("expired") ||
      msg.toLowerCase().includes("not found");
    return NextResponse.json(
      {
        error: isExpired
          ? "Code expired or not found. Generate a new one at actioncode.app"
          : "Invalid action code",
      },
      { status: 400 },
    );
  }

  try {
    // Build the USDC transfer directly on Solana — no Helio paylink needed.
    // Detection happens via action-code-status polling relay.resolve for txHash.
    const transaction = await buildUsdcTransferTx({
      buyerPublicKey: buyerPubkey,
      sellerPublicKey: seller.solana_wallet_address,
      amountUsd: product.price,
    });

    await client.relay.consume({
      code,
      chain: "solana",
      payload: {
        mode: "sign-and-execute-transaction",
        transaction,
        intendedFor: seller.solana_wallet_address,
      },
    });

    log.info("action_code_checkout: usdc transaction attached", {
      product_id: product.id,
      buyer_pubkey: buyerPubkey,
      seller_pubkey: seller.solana_wallet_address,
      amount_usd: product.price,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error("action_code_checkout: error", { error: serializeError(err) });
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
