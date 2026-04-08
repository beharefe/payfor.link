"use server";

import { TABLES } from "@unseallink/lib/db";
import { sendRefundBuyerEmail, sendRefundSellerEmail } from "@unseallink/lib/email";
import { log } from "@unseallink/lib/logger";
import { stripe } from "@unseallink/lib/stripe";
import { createClient, createServiceClient } from "@unseallink/lib/supabase/server";
import { serializeError } from "@unseallink/lib/utils";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type ActionResult = { error: string } | { ok: true };

export async function refundPurchase(orderId: string, note?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: order } = await supabase
    .from(TABLES.ORDERS)
    .select("id, product_id, seller_id, stripe_payment_id, stripe_refund_id, status, price_paid, platform_fee, currency, buyer_email, product_title")
    .eq("id", orderId)
    .single();

  if (!order || order.seller_id !== user.id) return { error: "Not found" };
  if (order.status === "refunded" || order.stripe_refund_id) return { ok: true }; // idempotent
  if (order.status !== "paid") return { error: "This order cannot be refunded" };
  if (!order.stripe_payment_id) return { error: "No payment found for this order" };

  let stripeRefundId: string;
  try {
    const refund = await stripe.refunds.create({ payment_intent: order.stripe_payment_id });
    stripeRefundId = refund.id;
  } catch (err) {
    log.error("refundPurchase: Stripe refund failed", {
      order_id: orderId,
      error: serializeError(err),
    });
    return { error: "Refund failed. Please try again or contact support." };
  }

  const service = createServiceClient();
  const { error: dbError } = await service
    .from(TABLES.ORDERS)
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
      refund_reason: note?.trim() || null,
      stripe_refund_id: stripeRefundId,
    })
    .eq("id", orderId)
    .eq("seller_id", user.id);

  if (dbError) {
    log.error("refundPurchase: failed to update order status", {
      order_id: orderId,
      error: dbError.message,
    });
    return { error: "Refund processed but failed to update record. Contact support." };
  }

  // Decrement stats — mirror of the increments done on purchase
  await Promise.all([
    service.rpc("increment_product_stats", {
      p_product_id: order.product_id,
      p_revenue: -order.price_paid,
      p_sales_delta: -1,
    }),
    service.rpc("increment_seller_stats", {
      p_seller_id: user.id,
      p_earned: -order.price_paid,
      p_fees: -order.platform_fee,
    }),
  ]);

  log.info("refundPurchase: success", { order_id: orderId, seller_id: user.id });

  revalidatePath(`/dashboard/links/${order.product_id}`);
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");

  // Send refund emails to buyer and seller (fire-and-forget, don't block the response)
  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  const { data: seller } = await service
    .from(TABLES.SELLERS)
    .select("email, name")
    .eq("id", user.id)
    .single();

  sendRefundBuyerEmail({
    to: order.buyer_email,
    productTitle: order.product_title,
    pricePaid: order.price_paid,
    currency: order.currency,
    orderId: order.id,
    sellerName: seller?.name ?? null,
  }).catch((err) => log.error("refund_buyer_email_failed", { order_id: orderId, error: String(err) }));

  if (seller?.email) {
    sendRefundSellerEmail({
      to: seller.email,
      sellerName: seller.name ?? "",
      productTitle: order.product_title,
      pricePaid: order.price_paid,
      platformFee: order.platform_fee,
      currency: order.currency,
      buyerEmail: order.buyer_email,
      orderId: order.id,
      note: note ?? null,
      dashboardUrl: `${appUrl}/dashboard/orders`,
    }).catch((err) => log.error("refund_seller_email_failed", { order_id: orderId, error: String(err) }));
  }

  return { ok: true };
}
