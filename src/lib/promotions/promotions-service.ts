/**
 * Generic Promotions Service
 *
 * Handles:
 * - Granting promotions to sellers (on signup, manual, code redemption)
 * - Calculating fee adjustments at charge time
 * - Recording usage after payment webhooks
 * - Reversing usage on refund webhooks
 * - Fetching active promotions for dashboard display
 *
 * All money values are in CENTS (integers). Never use floats for money.
 * calculateFee() reads from DB fresh — never cache. Race condition risk on concurrent payments.
 */

import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";

export type PromotionType =
  | "fee_waiver_gmv"
  | "fee_rate_reduction"
  | "flat_credit"
  | "feature_unlock";

export type PromotionStatus = "active" | "exhausted" | "expired" | "revoked";

export interface Promotion {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  type: PromotionType;
  config: Record<string, unknown>;
  auto_apply_on_signup: boolean;
  valid_until: string | null;
  max_redemptions: number | null;
  redemption_count: number;
}

export interface SellerPromotion {
  id: string;
  seller_id: string;
  promotion_id: string;
  status: PromotionStatus;
  used_value: number;
  max_value: number;
  config_snapshot: Record<string, unknown>;
  granted_at: string;
  expires_at: string | null;
  promotion: Promotion;
}

export interface FeeCalculationResult {
  original_fee_cents: number;
  final_fee_cents: number;
  savings_cents: number;
  promotions_applied: Array<{
    seller_promotion_id: string;
    promotion_name: string;
    benefit_cents: number;
  }>;
}

// ============================================================
// GRANT PROMOTIONS
// ============================================================

/**
 * Called on new seller signup. Grants all auto_apply promotions.
 * Safe to call multiple times — duplicate grants are silently ignored.
 */
export async function grantSignupPromotions(sellerId: string): Promise<void> {
  const supabase = createServiceClient();

  const now = new Date().toISOString();
  const { data: promotions } = await supabase
    .from(TABLES.PROMOTIONS)
    .select("*")
    .eq("is_active", true)
    .eq("auto_apply_on_signup", true)
    .or(`valid_until.is.null,valid_until.gte.${now}`);

  if (!promotions?.length) return;

  const eligible = promotions.filter(
    (p) => p.max_redemptions === null || p.redemption_count < p.max_redemptions,
  );

  for (const promotion of eligible) {
    await grantPromotionToSeller(sellerId, promotion.id, "system");
  }
}

/**
 * Grant a specific promotion to a seller.
 * Idempotent — silently returns null if already granted.
 */
export async function grantPromotionToSeller(
  sellerId: string,
  promotionId: string,
  grantedBy = "system",
  notes?: string,
): Promise<SellerPromotion | null> {
  const supabase = createServiceClient();

  const { data: promotion } = await supabase
    .from(TABLES.PROMOTIONS)
    .select("*")
    .eq("id", promotionId)
    .eq("is_active", true)
    .single();

  if (!promotion) return null;

  // Check redemption cap before granting
  if (
    promotion.max_redemptions !== null &&
    promotion.redemption_count >= promotion.max_redemptions
  ) {
    return null;
  }

  // biome-ignore lint/suspicious/noExplicitAny: promotion config is JSONB
  const { max_value, expires_at } = computeGrantParams(promotion as any);

  const { data } = await supabase
    .from(TABLES.SELLER_PROMOTIONS)
    .upsert(
      {
        seller_id: sellerId,
        promotion_id: promotionId,
        status: "active",
        used_value: 0,
        max_value,
        config_snapshot: promotion.config,
        expires_at,
        granted_by: grantedBy,
        notes,
      },
      {
        onConflict: "seller_id,promotion_id",
        ignoreDuplicates: true,
      },
    )
    .select("*, promotion:promotions(*)")
    .maybeSingle();

  // Increment redemption count — awaited so the serverless function doesn't drop it
  await supabase.rpc("increment_promotion_redemptions", { promotion_id: promotionId }).catch(() => undefined);

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  return (data as any) ?? null;
}

/**
 * Grant a promotion by code (e.g. seller enters 'LAUNCH2026' in dashboard settings).
 */
export async function redeemPromotionCode(
  sellerId: string,
  code: string,
): Promise<{ success: boolean; message: string; promotion?: SellerPromotion }> {
  const supabase = createServiceClient();

  const { data: promotion } = await supabase
    .from(TABLES.PROMOTIONS)
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (!promotion) {
    return { success: false, message: "Invalid or expired promotion code." };
  }

  const { data: existing } = await supabase
    .from(TABLES.SELLER_PROMOTIONS)
    .select("id")
    .eq("seller_id", sellerId)
    .eq("promotion_id", promotion.id)
    .maybeSingle();

  if (existing) {
    return { success: false, message: "You have already redeemed this promotion." };
  }

  const granted = await grantPromotionToSeller(sellerId, promotion.id, `code:${code}`);
  if (!granted) {
    return { success: false, message: "Failed to apply promotion. Please try again." };
  }

  return { success: true, message: `${promotion.name} applied!`, promotion: granted };
}

// ============================================================
// FEE CALCULATION
// ============================================================

const BASE_FEE_BPS = 450; // 4.5%

/**
 * Calculate the actual fee for a payment, applying any active promotions.
 * Call this BEFORE creating the Stripe Checkout Session.
 *
 * Reads seller promotions fresh from DB — never cache.
 */
export async function calculateFee(
  sellerId: string,
  grossAmountCents: number,
): Promise<FeeCalculationResult> {
  const supabase = createServiceClient();

  const originalFeeCents = Math.round((grossAmountCents * BASE_FEE_BPS) / 10000);
  let finalFeeCents = originalFeeCents;
  const promotionsApplied: FeeCalculationResult["promotions_applied"] = [];

  const now = new Date().toISOString();
  const { data: sellerPromotions } = await supabase
    .from(TABLES.SELLER_PROMOTIONS)
    .select("*, promotion:promotions(*)")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (!sellerPromotions?.length) {
    return {
      original_fee_cents: originalFeeCents,
      final_fee_cents: originalFeeCents,
      savings_cents: 0,
      promotions_applied: [],
    };
  }

  for (const sp of sellerPromotions) {
    // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
    const result = applyPromotionToFee(sp as any, grossAmountCents, finalFeeCents);
    if (result.benefit_cents > 0) {
      finalFeeCents = result.adjusted_fee_cents;
      // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
      promotionsApplied.push({
        seller_promotion_id: (sp as any).id,
        promotion_name: (sp as any).promotion?.name ?? "Promotion",
        benefit_cents: result.benefit_cents,
      });
    }
  }

  return {
    original_fee_cents: originalFeeCents,
    final_fee_cents: Math.max(0, finalFeeCents),
    savings_cents: originalFeeCents - Math.max(0, finalFeeCents),
    promotions_applied: promotionsApplied,
  };
}

function applyPromotionToFee(
  sp: SellerPromotion,
  grossAmountCents: number,
  currentFeeCents: number,
): { adjusted_fee_cents: number; benefit_cents: number } {
  const config = sp.config_snapshot;
  const remainingValue = sp.max_value - sp.used_value;

  switch (sp.promotion.type) {
    case "fee_waiver_gmv": {
      if (remainingValue <= 0) return { adjusted_fee_cents: currentFeeCents, benefit_cents: 0 };
      // Waive fee on up to `remainingValue` worth of GMV
      const coveredGmv = Math.min(grossAmountCents, remainingValue);
      const waivableFee = Math.round((coveredGmv * BASE_FEE_BPS) / 10000);
      const benefit = Math.min(waivableFee, currentFeeCents);
      return { adjusted_fee_cents: currentFeeCents - benefit, benefit_cents: benefit };
    }

    case "fee_rate_reduction": {
      const reductionBps = Number(config.reduction_bps ?? 0);
      const reducedFee = Math.round(
        (grossAmountCents * Math.max(0, BASE_FEE_BPS - reductionBps)) / 10000,
      );
      const benefit = currentFeeCents - reducedFee;
      return { adjusted_fee_cents: reducedFee, benefit_cents: Math.max(0, benefit) };
    }

    case "flat_credit": {
      if (remainingValue <= 0) return { adjusted_fee_cents: currentFeeCents, benefit_cents: 0 };
      const benefit = Math.min(currentFeeCents, remainingValue);
      return { adjusted_fee_cents: currentFeeCents - benefit, benefit_cents: benefit };
    }

    default:
      return { adjusted_fee_cents: currentFeeCents, benefit_cents: 0 };
  }
}

// ============================================================
// USAGE RECORDING (call from Stripe webhooks)
// ============================================================

/**
 * Record promotion usage after a payment succeeds.
 * Call this inside your checkout.session.completed webhook handler.
 */
export async function recordPaymentUsage(params: {
  sellerId: string;
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  grossAmountCents: number;
  feeCalculation: FeeCalculationResult;
}): Promise<void> {
  const supabase = createServiceClient();
  const { sellerId, stripePaymentIntentId, stripeChargeId, grossAmountCents, feeCalculation } =
    params;

  for (const applied of feeCalculation.promotions_applied) {
    const { data: sp } = await supabase
      .from(TABLES.SELLER_PROMOTIONS)
      .select("*, promotion:promotions(type)")
      .eq("id", applied.seller_promotion_id)
      .single();

    if (!sp) continue;

    // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
    const promotionType: PromotionType = (sp as any).promotion?.type;
    const usedValueDelta = computeUsedValueDelta(promotionType, grossAmountCents);
    // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
    const newUsedValue = (sp as any).used_value + usedValueDelta;
    // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
    const isExhausted = newUsedValue >= (sp as any).max_value;

    await supabase
      .from(TABLES.SELLER_PROMOTIONS)
      .update({
        used_value: newUsedValue,
        status: isExhausted ? "exhausted" : "active",
        exhausted_at: isExhausted ? new Date().toISOString() : null,
      })
      .eq("id", sp.id);

    await supabase.from(TABLES.PROMOTION_USAGE_LOG).insert({
      seller_promotion_id: sp.id,
      seller_id: sellerId,
      event_type: "payment_succeeded",
      stripe_payment_intent_id: stripePaymentIntentId,
      stripe_charge_id: stripeChargeId,
      gross_amount_cents: grossAmountCents,
      fee_before_cents: feeCalculation.original_fee_cents,
      fee_after_cents: feeCalculation.final_fee_cents,
      benefit_applied_cents: applied.benefit_cents,
      used_value_delta: usedValueDelta,
    });
  }
}

/**
 * Reverse promotion usage on refund.
 * Call this inside your charge.refunded webhook handler.
 */
export async function reversePaymentUsage(params: {
  stripePaymentIntentId: string;
  refundedAmountCents: number;
}): Promise<void> {
  const supabase = createServiceClient();

  const { data: usageLogs } = await supabase
    .from(TABLES.PROMOTION_USAGE_LOG)
    .select("*, seller_promotion:seller_promotions(*)")
    .eq("stripe_payment_intent_id", params.stripePaymentIntentId)
    .eq("event_type", "payment_succeeded");

  if (!usageLogs?.length) return;

  for (const usageLog of usageLogs) {
    // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
    const sp = (usageLog as any).seller_promotion;
    if (!sp) continue;

    const reversal = usageLog.used_value_delta;

    await supabase
      .from(TABLES.SELLER_PROMOTIONS)
      .update({
        used_value: Math.max(0, sp.used_value - reversal),
        status: "active",
        exhausted_at: null,
      })
      .eq("id", sp.id);

    await supabase.from(TABLES.PROMOTION_USAGE_LOG).insert({
      seller_promotion_id: sp.id,
      seller_id: sp.seller_id,
      event_type: "payment_refunded",
      stripe_payment_intent_id: params.stripePaymentIntentId,
      gross_amount_cents: -params.refundedAmountCents,
      fee_before_cents: 0,
      fee_after_cents: 0,
      benefit_applied_cents: -(usageLog.benefit_applied_cents ?? 0),
      used_value_delta: -reversal,
    });
  }
}

// ============================================================
// DASHBOARD DATA
// ============================================================

/**
 * Fetch all active promotions for a seller — for dashboard banner rendering.
 */
export async function getActivePromotionsForSeller(sellerId: string): Promise<SellerPromotion[]> {
  const supabase = createServiceClient();

  const now = new Date().toISOString();
  const { data } = await supabase
    .from(TABLES.SELLER_PROMOTIONS)
    .select("*, promotion:promotions(*)")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("granted_at", { ascending: true });

  // biome-ignore lint/suspicious/noExplicitAny: Supabase join type
  return (data as any[]) ?? [];
}

// ============================================================
// HELPERS
// ============================================================

function computeGrantParams(promotion: Promotion): {
  max_value: number;
  expires_at: string | null;
} {
  const config = promotion.config;

  switch (promotion.type) {
    case "fee_waiver_gmv":
      return {
        max_value: Number(config.waiver_cents ?? 0),
        expires_at: promotion.valid_until,
      };
    case "fee_rate_reduction":
      return {
        max_value: Number(config.duration_days ?? 30),
        expires_at: new Date(
          Date.now() + Number(config.duration_days ?? 30) * 86400000,
        ).toISOString(),
      };
    case "flat_credit":
      return {
        max_value: Number(config.credit_cents ?? 0),
        expires_at: promotion.valid_until,
      };
    case "feature_unlock":
      return {
        max_value: Number(config.duration_days ?? 30),
        expires_at: new Date(
          Date.now() + Number(config.duration_days ?? 30) * 86400000,
        ).toISOString(),
      };
    default:
      return { max_value: 0, expires_at: null };
  }
}

function computeUsedValueDelta(type: PromotionType, grossAmountCents: number): number {
  switch (type) {
    case "fee_waiver_gmv":
      return grossAmountCents; // track GMV consumed
    case "flat_credit":
      return Math.round((grossAmountCents * BASE_FEE_BPS) / 10000); // track credits spent
    default:
      return 0;
  }
}
