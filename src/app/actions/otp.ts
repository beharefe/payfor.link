"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { resend, FROM_EMAIL } from "@unseallink/lib/resend";
import { log } from "@unseallink/lib/logger";
import { TABLES } from "@unseallink/lib/db";

type ActionResult = { success: true } | { error: string };

export async function verifyOtp(
  orderId: string,
  code: string,
): Promise<ActionResult> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from(TABLES.ORDERS)
    .select(
      "id, buyer_email, buyer_email_verified, delivery_url, product_title",
    )
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found" };
  if (order.buyer_email_verified) redirect(`/orders/${orderId}`);

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: order.buyer_email,
    token: code.trim(),
    type: "email",
  });

  if (verifyError) {
    if (verifyError.message?.toLowerCase().includes("expired")) {
      return { error: "Code expired. Request a new one." };
    }
    return {
      error: verifyError.message ?? "Invalid or expired code. Request a new one.",
    };
  }

  await supabase
    .from(TABLES.ORDERS)
    .update({ buyer_email_verified: true })
    .eq("id", orderId);

  // Generate access token and send access email
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
  const unlockUrl = `${appUrl}/unlock?token=${rawToken}`;

  const { error: tokenError } = await supabase.from(TABLES.ACCESS_TOKENS).insert({
    order_id: orderId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (tokenError) {
    log.error("verifyOtp: insert access_token failed", { order_id: orderId, error: tokenError.message });
  } else {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.buyer_email,
      subject: `Your access link — ${order.product_title}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="font-size:20px;font-weight:500;margin:0 0 8px;">Your access is ready</h2>
          <p style="color:#666;margin:0 0 20px;">${order.product_title}</p>
          <a href="${unlockUrl}" style="display:inline-block;background:#111111;color:#ffffff;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:500;font-size:16px;">
            Access content →
          </a>
          <p style="color:#aaa;font-size:13px;margin-top:20px;">
            This link expires in 24 hours and can only be used once.<br>
            Can't click the button? Copy this link:<br>
            <span style="color:#666;">${unlockUrl}</span>
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="color:#aaa;font-size:12px;margin:0;">
            Purchased via <a href="${appUrl}" style="color:#aaa;">unseal.link</a> ·
            <a href="${appUrl}/orders" style="color:#aaa;">View your orders</a>
          </p>
        </div>
      `,
    });
  }

  redirect(`/orders/${orderId}`);
}

export async function resendOtp(orderId: string): Promise<ActionResult> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from(TABLES.ORDERS)
    .select("id, buyer_email, buyer_email_verified, product_title")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found" };
  if (order.buyer_email_verified) return { success: true };

  const { error } = await supabase.auth.signInWithOtp({
    email: order.buyer_email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes("rate") ?? false) {
      return { error: "Too many attempts. Please try again later." };
    }
    log.error("resendOtp signInWithOtp failed", {
      order_id: orderId,
      error: error.message,
    });
    return { error: "Failed to send code. Please try again." };
  }

  return { success: true };
}
