import Stripe from "stripe";

// The key is validated by Stripe only when making API calls, not at init time.
// A non-empty fallback prevents module init errors in build/test environments.
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? "sk_build_placeholder",
  { apiVersion: "2026-03-25.dahlia" },
);

export const PLATFORM_FEE_PERCENT = 0.045;

/** Calculate platform fee in cents for a given price in dollars. */
export function platformFeeCents(priceDollars: number): number {
  return Math.round(priceDollars * PLATFORM_FEE_PERCENT * 100);
}
