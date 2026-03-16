import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServiceClient } from "@payforlink/lib/supabase/server";
import { resend, FROM_EMAIL } from "@payforlink/lib/resend";
import { log } from "@payforlink/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.toString()?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: purchases } = await supabase
    .from("purchases")
    .select("id, product_title, buyer_email")
    .eq("buyer_email", email)
    .eq("status", "paid");

  if (!purchases?.length) {
    return NextResponse.json({ ok: true, message: "No purchases found for this email." });
  }

  for (const purchase of purchases) {
    // Invalidate any unused tokens for this purchase before issuing a new one.
    await supabase
      .from("unlock_tokens")
      .delete()
      .eq("purchase_id", purchase.id)
      .is("used_at", null);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("unlock_tokens").insert({
      purchase_id: purchase.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      log.error("resend-unlock: insert token failed", {
        purchase_id: purchase.id,
        error: insertError.message,
      });
      continue;
    }

    const unlockUrl = `${APP_URL}/unlock?token=${rawToken}`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: purchase.buyer_email,
      subject: `Your access link — ${purchase.product_title}`,
      html: `<p>Here is your access link. It expires in 24 hours and can only be used once.</p>
             <p><a href="${unlockUrl}">Access your purchase →</a></p>
             <p>If you didn't request this, ignore this email.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
