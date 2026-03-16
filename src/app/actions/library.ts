"use server";

import crypto from "node:crypto";
import { createClient, createServiceClient } from "@payforlink/lib/supabase/server";
import { resend, FROM_EMAIL } from "@payforlink/lib/resend";
import { log } from "@payforlink/lib/logger";

export type LibraryActionResult = { error: string } | { ok: true };

export async function sendLibraryMagicLink(formData: FormData): Promise<LibraryActionResult> {
  const email = formData.get("email")?.toString()?.trim();
  if (!email) return { error: "Email is required" };

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/library`,
      shouldCreateUser: true,
    },
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function resendAccess(purchaseId: string): Promise<LibraryActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not signed in" };

  const service = createServiceClient();
  const { data: purchase } = await service
    .from("purchases")
    .select("id, product_title, buyer_email")
    .eq("id", purchaseId)
    .eq("status", "paid")
    .single();

  if (!purchase) return { error: "Purchase not found" };
  if (purchase.buyer_email !== user.email) return { error: "Not your purchase" };

  // Invalidate any unused tokens before issuing a new one.
  await service
    .from("unlock_tokens")
    .delete()
    .eq("purchase_id", purchaseId)
    .is("used_at", null);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const unlockUrl = `${appUrl}/unlock?token=${rawToken}`;

  const { error: insertError } = await service.from("unlock_tokens").insert({
    purchase_id: purchase.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    log.error("resendAccess: insert token failed", { purchase_id: purchaseId });
    return { error: "Failed to generate link" };
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: purchase.buyer_email,
    subject: `Your access link — ${purchase.product_title}`,
    html: `<p>Here is your access link. It expires in 24 hours and can only be used once.</p>
           <p><a href="${unlockUrl}">Access your purchase →</a></p>`,
  });

  return { ok: true };
}
