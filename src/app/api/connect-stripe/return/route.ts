import { trackServer } from "@unseallink/lib/amplitude-server";
import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { stripe } from "@unseallink/lib/stripe";
import { createClient } from "@unseallink/lib/supabase/server";
import { serializeError } from "@unseallink/lib/utils";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { protocol, host } = request.nextUrl;
  const appUrl = `${protocol}//${host}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/auth", appUrl));

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (!seller?.stripe_account_id) {
    return NextResponse.redirect(new URL("/dashboard", appUrl));
  }

  try {
    const account = await stripe.accounts.retrieve(seller.stripe_account_id);
    const chargesEnabled = account.charges_enabled ?? false;

    await supabase
      .from(TABLES.SELLERS)
      .update({
        stripe_connected: chargesEnabled,
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: account.payouts_enabled ?? false,
        stripe_details_submitted: account.details_submitted ?? false,
      })
      .eq("id", user.id);

    if (chargesEnabled) {
      await supabase
        .from(TABLES.PRODUCTS)
        .update({ status: "active" })
        .eq("seller_id", user.id)
        .eq("status", "draft");

      void trackServer(
        { name: "Stripe Connected", props: { user_id: user.id } },
        user.id,
      );
    }
  } catch (err) {
    log.error("connect-stripe return failed", {
      user_id: user.id,
      error: serializeError(err),
    });
  }

  return NextResponse.redirect(new URL("/dashboard", appUrl));
}
