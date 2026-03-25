import { getVerifiedEmail, getVerifiedPurchaseEmail } from "@unseallink/lib/buyer-session";
import { TABLES } from "@unseallink/lib/db";
import { isValidUrl } from "@unseallink/lib/product-utils";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ order_id: string }> },
) {
  const { order_id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const service = createServiceClient();
  const { data: order } = await service
    .from(TABLES.ORDERS)
    .select("buyer_email, buyer_email_verified, delivery_url, status")
    .eq("id", order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!order.buyer_email_verified) {
    return NextResponse.redirect(new URL(`/orders/${order_id}`, appUrl));
  }

  if (order.status === "refunded") {
    return NextResponse.redirect(new URL(`/orders/${order_id}`, appUrl));
  }

  // Verify the requester owns this order.
  // Accept either a full orders_session OR a purchase_session scoped to this order.
  const cookieStore = await cookies();
  const verifiedEmail =
    getVerifiedEmail(cookieStore.get("orders_session")?.value) ??
    getVerifiedPurchaseEmail(cookieStore.get("purchase_session")?.value, order_id);
  if (!verifiedEmail || verifiedEmail !== order.buyer_email) {
    // Session missing or expired — send buyer to re-authenticate.
    return NextResponse.redirect(
      new URL(`/orders?next=/orders/${order_id}`, appUrl),
    );
  }

  // Re-validate delivery_url at redirect time — defense against compromised DB records
  if (!isValidUrl(order.delivery_url)) {
    return NextResponse.json(
      { error: "Invalid delivery URL" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(order.delivery_url);
}
