"use server";

import crypto from "node:crypto";
import { setPurchaseSession } from "@unseallink/lib/buyer-session";
import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { FROM_EMAIL, resend } from "@unseallink/lib/resend";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { serializeError } from "@unseallink/lib/utils";
import { redirect } from "next/navigation";

type ActionResult = { success: true } | { error: string };

export async function verifyOtp(
  orderId: string,
  code: string,
): Promise<ActionResult> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from(TABLES.ORDERS)
    .select(
      "id, buyer_email, buyer_email_verified, delivery_url, product_title, otp_hash, otp_expires_at",
    )
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found" };
  if (order.buyer_email_verified) redirect(`/orders/${orderId}`);

  if (!order.otp_hash || !order.otp_expires_at) {
    return { error: "No verification code found. Request a new one." };
  }

  if (new Date(order.otp_expires_at) < new Date()) {
    return { error: "Code expired. Request a new one." };
  }

  const inputHash = crypto
    .createHash("sha256")
    .update(code.trim())
    .digest("hex");
  if (inputHash !== order.otp_hash) {
    return { error: "Invalid code. Check your email and try again." };
  }

  await supabase
    .from(TABLES.ORDERS)
    .update({
      buyer_email_verified: true,
      otp_hash: null,
      otp_expires_at: null,
    })
    .eq("id", orderId);

  // Grant a purchase-scoped session for this specific order only.
  // Does NOT grant access to the full orders list — buyer must verify separately there.
  await setPurchaseSession(order.buyer_email, orderId);

  // Generate access token and send access email
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
  const unlockUrl = `${appUrl}/unlock?token=${rawToken}`;

  const { error: tokenError } = await supabase
    .from(TABLES.ACCESS_TOKENS)
    .insert({
      order_id: orderId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

  if (tokenError) {
    log.error("verifyOtp: insert access_token failed", {
      order_id: orderId,
      error: tokenError.message,
    });
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
            <a href="${appUrl}/orders/${orderId}" style="color:#aaa;">View your order</a>
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

  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from(TABLES.ORDERS)
    .update({ otp_hash: otpHash, otp_expires_at: otpExpiresAt })
    .eq("id", order.id);

  if (updateError) {
    log.error("resendOtp: update failed", {
      order_id: orderId,
      error: updateError.message,
    });
    return { error: "Failed to send code. Please try again." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
  const { error: emailError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: order.buyer_email,
    subject: `Your verification code — ${order.product_title}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="font-size:20px;font-weight:500;margin:0 0 8px;">Verify your email</h2>
        <p style="color:#666;margin:0 0 20px;">Enter this code to access your purchase:</p>
        <p style="font-size:36px;font-weight:700;letter-spacing:8px;margin:0 0 20px;">${otpCode}</p>
        <p style="color:#aaa;font-size:13px;margin:0;">Expires in 15 minutes. Purchased via <a href="${appUrl}" style="color:#aaa;">unseal.link</a></p>
      </div>
    `,
  });

  if (emailError) {
    log.error("resendOtp: email send failed", {
      order_id: orderId,
      error: serializeError(emailError),
    });
    return { error: "Failed to send code. Please try again." };
  }

  return { success: true };
}
