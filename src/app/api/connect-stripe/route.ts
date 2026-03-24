import { getStripeConnectAccountLinkUrl } from "@unseallink/lib/stripe-connect";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = await getStripeConnectAccountLinkUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(
      new URL(
        "/dashboard?connect=error",
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      ),
    );
  }
}
