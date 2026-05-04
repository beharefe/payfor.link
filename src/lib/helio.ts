import crypto from "node:crypto";

const HELIO_API_BASE = "https://api.hel.io/v1";

// 1% platform fee — collected off-chain (Helio's public API does not support on-chain splits).
export const CRYPTO_PLATFORM_FEE_PERCENT = 1;

function helioSecretKey(): string {
  return process.env.HELIO_API_SECRET_KEY ?? "";
}

function helioPublicKey(): string {
  return process.env.HELIO_API_PUBLIC_KEY ?? "";
}

function helioWebhookSecret(): string {
  return process.env.HELIO_WEBHOOK_SECRET ?? "";
}

export type HelioPayLink = {
  id: string;
  checkoutUrl: string;
};

// Resolves the Helio internal ID for USDC on Solana.
// Checks HELIO_USDC_CURRENCY_ID env var first to avoid the extra round-trip.
// Set HELIO_USDC_CURRENCY_ID from your Helio dashboard → Currencies, or from GET /v1/currency/all.
async function getUsdcCurrencyId(publicKey: string, secret: string): Promise<string> {
  const envId = process.env.HELIO_USDC_CURRENCY_ID;
  if (envId) return envId;

  const url = new URL(`${HELIO_API_BASE}/currency/all`);
  url.searchParams.set("apiKey", publicKey);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) throw new Error(`Helio currencies fetch failed: ${res.status}`);
  const currencies = (await res.json()) as Array<{
    id: string;
    symbol: string;
    blockchain?: { engine?: { type?: string } };
  }>;
  const usdc = currencies.find(
    (c) => c.symbol === "USDC" && c.blockchain?.engine?.type === "SOL",
  );
  if (!usdc) throw new Error("USDC on Solana not found in Helio currencies list");
  return usdc.id;
}

// Creates a single-use USDC pay link via the Helio public API.
// Endpoint: POST /v1/paylink/create/api-key  (requires HELIO_API_PUBLIC_KEY + HELIO_API_SECRET_KEY)
// Price must be in USDC smallest unit (6 decimals): $9.99 → "9990000"
// walletId in recipients accepts the raw Solana address per the public API.
export async function createHelioPayLink(params: {
  productTitle: string;
  priceUsd: number;
  sellerWalletAddress: string;
}): Promise<HelioPayLink> {
  const secret = helioSecretKey();
  const publicKey = helioPublicKey();

  if (!secret || !publicKey) {
    throw new Error("HELIO_API_SECRET_KEY and HELIO_API_PUBLIC_KEY must be set");
  }

  const currencyId = await getUsdcCurrencyId(publicKey, secret);

  // USDC has 6 decimal places on Solana: $9.99 → 9990000
  const priceMinimalUnit = String(Math.round(params.priceUsd * 1_000_000));

  const url = new URL(`${HELIO_API_BASE}/paylink/create/api-key`);
  url.searchParams.set("apiKey", publicKey);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      name: params.productTitle,
      price: priceMinimalUnit,
      pricingCurrency: currencyId,
      template: "OTHER",
      maxTransactions: 1,
      features: { canChangeQuantity: false, requireEmail: false },
      recipients: [{ currencyId, walletId: params.sellerWalletAddress }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Helio API ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { id: string };
  return {
    id: data.id,
    checkoutUrl: `https://app.hel.io/pay/${data.id}`,
  };
}

// Verifies the dual-signature Helio uses on webhook deliveries:
//   Authorization: Bearer <sharedToken>       — exact bearer match
//   X-Signature:   HMAC-SHA256(body+secret)   — timing-safe HMAC check
// Both must pass. See: https://docs.hel.io/docs/webhooks
export function verifyHelioWebhookSignature(params: {
  rawBody: string;
  xSignature: string;
  authorizationHeader: string;
}): boolean {
  const secret = helioWebhookSecret();
  if (!secret) return false;

  const bearerToken = params.authorizationHeader.replace(/^Bearer\s+/i, "");
  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(params.rawBody + secret)
    .digest("hex");

  try {
    const tokenMatches = crypto.timingSafeEqual(
      Buffer.from(bearerToken),
      Buffer.from(secret),
    );
    const hmacMatches = crypto.timingSafeEqual(
      Buffer.from(params.xSignature, "hex"),
      Buffer.from(expectedHmac, "hex"),
    );
    return tokenMatches && hmacMatches;
  } catch {
    return false;
  }
}

export type HelioWebhookPayload = {
  event: "CREATED" | "STARTED" | "RENEWED" | "ENDED";
  paymentRequestId?: string;
  transactionSignature?: string;
  transactionId?: string;
  normalizedTotalPrice?: string;
  pricingCurrency?: string;
  sender?: { publicKey?: string };
};

// Prepares an unsigned Solana transaction for an existing pay link.
// Endpoint: POST /v1/transaction/headless/prepare
// The buyer's wallet signs and broadcasts the transaction (via Action Codes or browser wallet).
export async function prepareHelioTransaction(params: {
  paylinkId: string;
  payerWalletAddress: string;
}): Promise<string> {
  const secret = helioSecretKey();

  const response = await fetch(`${HELIO_API_BASE}/transaction/headless/prepare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      paymentRequestId: params.paylinkId,
      senderPublicKey: params.payerWalletAddress,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Helio transaction API ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { serializedTransaction?: string };
  if (!data.serializedTransaction) {
    throw new Error("Helio transaction API returned no serializedTransaction");
  }
  return data.serializedTransaction;
}

export function extractPaylinkId(payload: HelioWebhookPayload): string | null {
  return payload.paymentRequestId ?? null;
}

export function extractTransactionId(
  payload: HelioWebhookPayload,
): string | null {
  return payload.transactionSignature ?? payload.transactionId ?? null;
}
