import { createSessionValue, verifyBuyerToken } from "@unseallink/lib/buyer-token";
import { type NextRequest, NextResponse } from "next/server";

/** Verifies the signed token from the purchase email, sets buyer_session cookie.
 *  If `oid` (order id) is provided, redirects straight to the access route (→ delivery URL).
 *  Otherwise falls back to /orders. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const orderId = searchParams.get("oid");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(new URL("/orders?error=missing_token", appUrl));
  }

  const payload = verifyBuyerToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/orders?error=link_expired", appUrl));
  }

  const destination = orderId
    ? new URL(`/api/orders/${orderId}/access`, appUrl)
    : new URL("/orders", appUrl);

  const response = NextResponse.redirect(destination);
  response.cookies.set("buyer_session", createSessionValue(payload.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
