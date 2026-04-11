import { hashAccessToken } from "@unseallink/lib/access-token";
import { createSessionValue } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let rawToken: string;
  let orderId: string;
  try {
    const body = await request.json();
    rawToken = typeof body.t === "string" ? body.t.trim() : "";
    orderId = typeof body.oid === "string" ? body.oid.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!rawToken || !orderId) {
    return NextResponse.json({ error: "Missing token or order" }, { status: 400 });
  }

  const hash = hashAccessToken(rawToken);
  const supabase = createServiceClient();

  // Find token — use a transaction-safe pattern: fetch then update
  const { data: token } = await supabase
    .from(TABLES.ACCESS_TOKENS)
    .select("id, used_at, expires_at, order_id")
    .eq("token_hash", hash)
    .eq("order_id", orderId)
    .single();

  if (!token) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 401 });
  }

  if (token.used_at) {
    return NextResponse.json({ error: "This link has already been used. Request a new one." }, { status: 401 });
  }

  if (new Date(token.expires_at) < new Date()) {
    return NextResponse.json({ error: "This link has expired. Request a new one." }, { status: 401 });
  }

  // Look up the order to get buyer email
  const { data: order } = await supabase
    .from(TABLES.ORDERS)
    .select("buyer_email, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status === "refunded") {
    return NextResponse.json({ error: "This order has been refunded." }, { status: 403 });
  }

  // Consume the token atomically — if another request already set used_at this will be a no-op
  const { error: updateError } = await supabase
    .from(TABLES.ACCESS_TOKENS)
    .update({ used_at: new Date().toISOString() })
    .eq("id", token.id)
    .is("used_at", null); // Only update if still unused (race-condition guard)

  if (updateError) {
    log.error("consume-token: failed to mark token used", {
      token_id: token.id,
      error: updateError.message,
    });
    return NextResponse.json({ error: "Failed to process token." }, { status: 500 });
  }

  // Set buyer session cookie (30 days) so the access route can verify identity
  const response = NextResponse.json({ ok: true });
  response.cookies.set("buyer_session", createSessionValue(order.buyer_email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
