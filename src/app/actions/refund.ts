"use server";

import { createClient } from "@unseallink/lib/supabase/server";
import { stripe } from "@unseallink/lib/stripe";
import { log } from "@unseallink/lib/logger";
import { TABLES } from "@unseallink/lib/db";
import { redirect } from "next/navigation";

type ActionResult = { error: string } | { ok: true };

export async function refundPurchase(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Fetch the order and verify the seller owns the product
  const { data: order } = await supabase
    .from(TABLES.ORDERS)
    .select("id, link_id, seller_id, stripe_payment_id, status, price_paid")
    .eq("id", orderId)
    .single();

  if (!order || order.seller_id !== user.id) return { error: "Not found" };
  if (order.status !== "paid") return { error: "This order cannot be refunded" };
  if (!order.stripe_payment_id) return { error: "No payment found for this order" };

  try {
    await stripe.refunds.create({ payment_intent: order.stripe_payment_id });
  } catch (err) {
    log.error("refundPurchase: Stripe refund failed", {
      order_id: orderId,
      error: String(err),
    });
    return { error: "Refund failed. Please try again or contact support." };
  }

  const { error: dbError } = await supabase
    .from(TABLES.ORDERS)
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("seller_id", user.id);

  if (dbError) {
    log.error("refundPurchase: failed to update order status", {
      order_id: orderId,
      error: dbError.message,
    });
    // Refund succeeded in Stripe — don't fail silently, but don't double-refund
    return { error: "Refund processed but failed to update record. Contact support." };
  }

  log.info("refundPurchase: success", { order_id: orderId, seller_id: user.id });

  redirect(`/dashboard/links/${order.link_id}`);
}
