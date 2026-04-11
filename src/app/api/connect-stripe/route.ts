import { getStripeConnectAccountLinkUrl } from "@unseallink/lib/stripe-connect";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { protocol, host } = request.nextUrl;
  const appUrl = `${protocol}//${host}`;
  try {
    const url = await getStripeConnectAccountLinkUrl(appUrl);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/dashboard?connect=error", appUrl));
  }
}
