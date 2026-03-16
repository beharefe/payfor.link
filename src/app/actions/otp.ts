"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@payforlink/lib/supabase/server";
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
  if (purchase.buyer_email_verified) redirect(`/delivery/${purchaseId}`);

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
      error: verifyError.message ?? "Invalid or expired code. Request a new one.",
    };
  }

  await supabase
    .from("purchases")
    .update({ buyer_email_verified: true })
    .eq("id", purchaseId);

  redirect(`/delivery/${purchaseId}`);
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
