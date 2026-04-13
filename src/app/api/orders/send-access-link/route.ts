import { generateAccessToken } from "@unseallink/lib/access-token";
import { createBuyerToken } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { sendBuyerAccessEmail, sendBuyerSignInEmail } from "@unseallink/lib/email";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let email: string;
  let oid: string | undefined;
  try {
    const body = await request.json();
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    oid = typeof body.oid === "string" && body.oid.trim() ? body.oid.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Always return ok — don't reveal whether an account/orders exist for this email
  const reqUrl = new URL(request.url);
  const appUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  const service = createServiceClient();

  if (oid) {
    // Resend for a specific order — generate a fresh single-use access token
    const { data: order } = await service
      .from(TABLES.ORDERS)
      .select("id, product_title, buyer_email")
      .eq("id", oid)
      .eq("buyer_email", email)
      .single();

    if (order) {
      // Rate limit: don't create a new token if one was issued in the last 60 seconds.
      // Prevents inbox flooding if someone hammers the resend button.
      const { data: recentToken } = await service
        .from(TABLES.ACCESS_TOKENS)
        .select("created_at")
        .eq("order_id", order.id)
        .gte("created_at", new Date(Date.now() - 60_000).toISOString())
        .limit(1)
        .maybeSingle();

      if (recentToken) {
        // A token was just issued — tell the client without burning an attempt.
        return NextResponse.json({ ok: true, sent: false });
      }

      const { raw, hash, expiresAt } = generateAccessToken();
      const { error: insertError } = await service.from(TABLES.ACCESS_TOKENS).insert({
        order_id: order.id,
        token_hash: hash,
        expires_at: expiresAt.toISOString(),
      });

      if (!insertError) {
        const accessLink = `${appUrl}/orders/access?t=${raw}&oid=${order.id}`;
        sendBuyerAccessEmail({
          to: order.buyer_email,
          accessLink,
          productTitle: order.product_title,
          orderUrl: `${appUrl}/orders/${order.id}`,
        }).catch((err) => log.error("send-access-link: email failed", { error: String(err) }));
        return NextResponse.json({ ok: true, sent: true });
      }
    }
  } else {
    // General sign-in (no specific order) — send a portal sign-in link (stateful JWT, portal only)
    const { data: orders } = await service
      .from(TABLES.ORDERS)
      .select("id")
      .eq("buyer_email", email)
      .limit(1);

    if (orders?.length) {
      const token = createBuyerToken(email);
      const link = `${appUrl}/api/orders/verify?token=${token}`;
      await sendBuyerSignInEmail({ to: email, link }).catch((err) =>
        log.error("send-access-link: sign-in email failed", { error: String(err) }),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
