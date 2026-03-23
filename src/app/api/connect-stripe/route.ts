import { NextResponse } from "next/server";
import { getStripeConnectAccountLinkUrl } from "@unseallink/lib/stripe-connect";

export async function GET() {
  try {
    const url = await getStripeConnectAccountLinkUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/studio?connect=error", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }
}
