export const STRIPE_CARD_PERCENTAGE = 0.029
export const STRIPE_CARD_FIXED_CENTS = 30
export const PLATFORM_FEE_RATE = 0.045
export const STRIPE_ACH_PERCENTAGE = 0.008
export const STRIPE_ACH_MAX_CENTS = 500

/**
 * Payment methods covered by Stripe Atlas $100K GMV promo.
 * Confirmed by Stripe support: card-rate methods only (2.9% + $0.30 waived).
 * Non-card methods (BLIK, SEPA, ACH, etc.) are NOT covered.
 */
export const ATLAS_PROMO_COVERED: Set<string> = new Set([
  'card',
  'apple_pay',
  'google_pay',
  'link',
  'alipay',
  'wechat_pay',
  'amazon_pay',
  'cashapp',
])

export function isAtlasPromoCovered(paymentMethodType: string): boolean {
  return ATLAS_PROMO_COVERED.has(paymentMethodType)
}

/** Calculate Stripe processing fee for a given payment method, in cents. */
export function calculateStripeFee(amountCents: number, paymentMethodType: string): number {
  if (paymentMethodType === 'us_bank_account') {
    return Math.min(Math.round(amountCents * STRIPE_ACH_PERCENTAGE), STRIPE_ACH_MAX_CENTS)
  }
  return Math.round(amountCents * STRIPE_CARD_PERCENTAGE) + STRIPE_CARD_FIXED_CENTS
}
