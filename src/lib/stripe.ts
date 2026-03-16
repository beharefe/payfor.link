import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLATFORM_FEE_PERCENT = 0.045;

/** Calculate platform fee in cents for a given price in dollars. */
export function platformFeeCents(priceDollars: number): number {
  return Math.round(priceDollars * PLATFORM_FEE_PERCENT * 100);
}
