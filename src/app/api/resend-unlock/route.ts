import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { render } from "@react-email/render";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { resend, FROM_EMAIL } from "@unseallink/lib/resend";
import { log } from "@unseallink/lib/logger";
import { TABLES } from "@unseallink/lib/db";
import { AccessLinkEmail } from "@unseallink/emails/access-link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.toString()?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Rate limit: max 3 resend requests per email per hour via token count
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: emailOrders } = await supabase
    .from(TABLES.ORDERS)
    .select("id")
    .eq("buyer_email", email);
  const orderIds = (emailOrders ?? []).map((o) => o.id);
  if (orderIds.length > 0) {
    const { count } = await supabase
      .from(TABLES.ACCESS_TOKENS)
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneHourAgo)
      .in("order_id", orderIds);
    if ((count ?? 0) >= 3) {
      return NextResponse.json({ ok: true }); // Silent: don't reveal throttle exists
    }
  }
  const { data: orders } = await supabase
    .from(TABLES.ORDERS)
    .select("id, product_title, buyer_email")
    .eq("buyer_email", email)
    .eq("status", "paid");

  if (!orders?.length) {
    return NextResponse.json({ ok: true, message: "No orders found for this email." });
  }

  for (const order of orders) {
    // Invalidate any unused tokens for this order before issuing a new one.
    await supabase
      .from(TABLES.ACCESS_TOKENS)
      .delete()
      .eq("order_id", order.id)
      .is("used_at", null);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from(TABLES.ACCESS_TOKENS).insert({
      order_id: order.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      log.error("resend-unlock: insert token failed", {
        order_id: order.id,
        error: insertError.message,
      });
      continue;
    }

    const unlockUrl = `${APP_URL}/unlock?token=${rawToken}`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.buyer_email,
      subject: `Your access link — ${order.product_title}`,
      html: await render(
        AccessLinkEmail({ unlockUrl, productTitle: order.product_title })
      ),
    });
  }

  return NextResponse.json({ ok: true });
}
