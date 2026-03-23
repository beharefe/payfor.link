import { NextResponse } from "next/server";
import { createClient } from "@unseallink/lib/supabase/server";
import { stripe } from "@unseallink/lib/stripe";
import { log } from "@unseallink/lib/logger";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", appUrl));
  }

  const { data: seller } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!seller?.stripe_account_id) {
    return NextResponse.redirect(new URL("/studio", appUrl));
  }

  try {
    const account = await stripe.accounts.retrieve(seller.stripe_account_id);

    await supabase
      .from("users")
      .update({
        stripe_connected: true,
        stripe_charges_enabled: account.charges_enabled ?? false,
        stripe_payouts_enabled: account.payouts_enabled ?? false,
        stripe_details_submitted: account.details_submitted ?? false,
      })
      .eq("id", user.id);

    await supabase
      .from("links")
      .update({ status: "active" })
      .eq("seller_id", user.id)
      .eq("status", "draft");
  } catch (err) {
    log.error("connect-stripe return failed", { user_id: user.id, error: String(err) });
  }

  return NextResponse.redirect(new URL("/studio", appUrl));
}
