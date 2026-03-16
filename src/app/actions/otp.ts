"use server";

import crypto from "node:crypto";
import { createServiceClient } from "@payforlink/lib/supabase/server";
import { resend, FROM_EMAIL } from "@payforlink/lib/resend";
import { log } from "@payforlink/lib/logger";

type ActionResult = { success: true } | { error: string };

export async function verifyOtp(
  purchaseId: string,
  code: string,
): Promise<ActionResult> {
  const supabase = createServiceClient();

  const { data: purchase } = await supabase
    .from("purchases")
    .select(
      "id, buyer_email, buyer_email_verified, delivery_url, product_title",
    )
    .eq("id", purchaseId)
    .single();

  if (!purchase) return { error: "Purchase not found" };
  if (purchase.buyer_email_verified) return { success: true };

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: purchase.buyer_email,
    token: code.trim(),
    type: "email",
  });

  if (verifyError) {
    if (verifyError.message?.toLowerCase().includes("expired")) {
      return { error: "Code expired. Request a new one." };
    }
    return {
      error:
        verifyError.message ?? "Invalid or expired code. Request a new one.",
    };
  }

  // Verified — invalidate old unused tokens, then issue a fresh one.
  await supabase
    .from("unlock_tokens")
    .delete()
    .eq("purchase_id", purchaseId)
    .is("used_at", null);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const [, tokenError] = await Promise.all([
    supabase
      .from("purchases")
      .update({ buyer_email_verified: true })
      .eq("id", purchaseId),
    supabase
      .from("unlock_tokens")
      .insert({
        purchase_id: purchaseId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .then(({ error }) => error),
  ]);

  if (tokenError) {
    log.error("Failed to create unlock token", { purchase_id: purchaseId });
    return { error: "Something went wrong. Please contact support." };
  }

  const unlockUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unlock?token=${rawToken}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: purchase.buyer_email,
    subject: `Your access link — ${purchase.product_title}`,
    html: `<p>Here is your access link. It expires in 24 hours and can only be used once.</p>
           <p><a href="${unlockUrl}">Access your purchase →</a></p>
           <p>If you didn't request this, ignore this email.</p>`,
  });

  return { success: true };
}

export async function resendOtp(purchaseId: string): Promise<ActionResult> {
  const supabase = createServiceClient();

  const { data: purchase } = await supabase
    .from("purchases")
    .select("id, buyer_email, buyer_email_verified, product_title")
    .eq("id", purchaseId)
    .single();

  if (!purchase) return { error: "Purchase not found" };
  if (purchase.buyer_email_verified) return { success: true };

  const { error } = await supabase.auth.signInWithOtp({
    email: purchase.buyer_email,
    options: {
      shouldCreateUser: true,
      // Optional: customize redirect if using magic link; 6-digit OTP is configured in Supabase
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes("rate") ?? false) {
      return { error: "Too many attempts. Please try again later." };
    }
    log.error("resendOtp signInWithOtp failed", {
      purchase_id: purchaseId,
      error: error.message,
    });
    return { error: "Failed to send code. Please try again." };
  }

  return { success: true };
}
