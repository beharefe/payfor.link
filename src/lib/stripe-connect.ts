import { createClient } from "@unseallink/lib/supabase/server";
import { stripe } from "@unseallink/lib/stripe";
import { log } from "@unseallink/lib/logger";

/** Returns the Stripe account onboarding URL for the current user. Throws if unauthorized or no user. */
export async function getStripeConnectAccountLinkUrl(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: seller } = await supabase
    .from("sellers")
    .select("stripe_account_id, email")
    .eq("id", user.id)
    .single();

  if (!seller) throw new Error("User not found");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let stripeAccountId = seller.stripe_account_id;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: seller.email,
    });
    stripeAccountId = account.id;
    const { error } = await supabase
      .from("sellers")
      .update({ stripe_account_id: stripeAccountId })
      .eq("id", user.id);
    if (error) {
      // Log the Stripe account ID so it can be manually linked if needed.
      log.error("Failed to save stripe_account_id — orphaned Stripe account created", {
        user_id: user.id,
        stripe_account_id: stripeAccountId,
      });
      throw new Error("Failed to connect Stripe");
    }
  }

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    type: "account_onboarding",
    collection_options: { fields: "eventually_due" },
    return_url: `${appUrl}/api/connect-stripe/return`,
    refresh_url: `${appUrl}/api/connect-stripe/refresh`,
  });

  return accountLink.url;
}

/**
 * Returns URL for withdraw/KYC flow.
 * Always fetches live status from Stripe — never trusts our DB cache.
 * - Payouts not enabled → Stripe account onboarding link to complete currently_due requirements.
 * - Payouts enabled → Stripe Express dashboard login link so seller can manage payouts.
 */
export async function getStripeWithdrawUrl(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: seller } = await supabase
    .from("sellers")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!seller?.stripe_account_id) return null;

  // Always ask Stripe — never rely on our cached flags.
  const account = await stripe.accounts.retrieve(seller.stripe_account_id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!account.payouts_enabled) {
    const accountLink = await stripe.accountLinks.create({
      account: seller.stripe_account_id,
      type: "account_onboarding",
      collection_options: { fields: "currently_due" },
      return_url: `${appUrl}/dashboard`,
      refresh_url: `${appUrl}/dashboard?withdraw=refresh`,
    });
    return accountLink.url;
  }

  // Payouts already enabled — send seller to Stripe Express dashboard.
  const loginLink = await stripe.accounts.createLoginLink(seller.stripe_account_id);
  return loginLink.url;
}
