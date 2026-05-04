import crypto from "node:crypto";

const HELIO_API_BASE = "https://api.hel.io/v1";

// Platform fee taken on every crypto payment, split on-chain via Helio's splitWallets.
// Helio enforces shares as integers that must sum to 100.
export const CRYPTO_PLATFORM_FEE_PERCENT = 1;

function helioSecretKey(): string {
  return process.env.HELIO_API_SECRET_KEY ?? "";
}

function helioMerchantId(): string {
  return process.env.HELIO_MERCHANT_ID ?? "";
}

function helioWebhookSecret(): string {
  return process.env.HELIO_WEBHOOK_SECRET ?? "";
}

function platformSolanaWallet(): string {
  return process.env.PLATFORM_SOLANA_WALLET ?? "";
}

export type HelioPayLink = {
  id: string;
  checkoutUrl: string;
};

// Creates a single-use USDC pay link.
// splitWallets routes CRYPTO_PLATFORM_FEE_PERCENT% to the platform wallet on-chain;
// the seller receives the remainder atomically in the same transaction.
// Field names verified against CreatePaylinkDto in https://api.dev.hel.io/v1/docs-json.
// The `company` field is deprecated but remains in the required[] array of the schema.
export async function createHelioPayLink(params: {
  productTitle: string;
  priceUsd: number;
  sellerWalletAddress: string;
}): Promise<HelioPayLink> {
  const secret = helioSecretKey();
  const merchantId = helioMerchantId();
  const platformWallet = platformSolanaWallet();

  if (!secret || !merchantId) {
    throw new Error("HELIO_API_SECRET_KEY and HELIO_MERCHANT_ID must be set");
  }
  if (!platformWallet) {
    throw new Error("PLATFORM_SOLANA_WALLET must be set to collect the platform fee");
  }

  const sellerShare = 100 - CRYPTO_PLATFORM_FEE_PERCENT;

  const response = await fetch(`${HELIO_API_BASE}/paylink`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      "x-merchant-id": merchantId,
    },
    body: JSON.stringify({
      name: params.productTitle,
      pricingCurrency: "USDC",
      price: params.priceUsd.toFixed(2),
      template: "OTHER",
      // Single-use: each checkout attempt gets its own pay link
      maxTransactions: 1,
      // Helio splits proceeds atomically on-chain in the same transaction.
      // Shares are integers that must sum to 100.
      splitWallets: [
        { walletAddress: params.sellerWalletAddress, share: sellerShare },
        { walletAddress: platformWallet, share: CRYPTO_PLATFORM_FEE_PERCENT },
      ],
      features: { canChangeQuantity: false, requireEmail: false },
      // Deprecated but still required in CreatePaylinkDto schema
      company: merchantId,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Helio API ${response.status}: ${body}`);
  }

  // The 201 response in the spec has no documented schema.
  // Helio returns an object with at minimum an `id` field — verify with live API if needed.
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
    // Buffer lengths differ → clear mismatch
    return false;
  }
}

// Helio webhook payload for CREATED events on a pay link.
// Field names inferred from Helio's documented patterns and JS SDK.
// Use the Helio dashboard's "Manual Replay" to verify exact field names against a real payload.
export type HelioWebhookPayload = {
  event: "CREATED" | "STARTED" | "RENEWED" | "ENDED";
  // The paylinkId we stored in pending_crypto_checkouts
  paymentRequestId?: string;
  // Stable Solana transaction signature — used as crypto_transaction_id for idempotency
  transactionSignature?: string;
  transactionId?: string;
  normalizedTotalPrice?: string;
  pricingCurrency?: string;
  sender?: { publicKey?: string };
};

// Fetches an unsigned Solana transaction for an existing pay link.
// Helio's headless payments API builds the transaction (including splitWallets fee split)
// so the buyer's wallet only needs to sign it.
// Docs: https://docs.hel.io/docs/headless-payments
export async function prepareHelioTransaction(params: {
  paylinkId: string;
  payerWalletAddress: string;
}): Promise<string> {
  const secret = helioSecretKey();
  const merchantId = helioMerchantId();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://unseal.link";

  const response = await fetch(
    `${HELIO_API_BASE}/paylink/${params.paylinkId}/transaction`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        "x-merchant-id": merchantId,
        Origin: appUrl,
      },
      body: JSON.stringify({ payer: params.payerWalletAddress }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Helio transaction API ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { transaction: string };
  if (!data.transaction) {
    throw new Error("Helio transaction API returned no transaction field");
  }
  return data.transaction;
}

export function extractPaylinkId(payload: HelioWebhookPayload): string | null {
  return payload.paymentRequestId ?? null;
}

export function extractTransactionId(
  payload: HelioWebhookPayload,
): string | null {
  return payload.transactionSignature ?? payload.transactionId ?? null;
}
