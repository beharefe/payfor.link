import { NextResponse } from "next/server";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { TABLES } from "@unseallink/lib/db";
import { isValidUrl } from "@unseallink/lib/product-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ order_id: string }> },
) {
  const { order_id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const service = createServiceClient();
  const { data: order } = await service
    .from(TABLES.ORDERS)
    .select("buyer_email_verified, delivery_url, status")
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

  // Re-validate delivery_url at redirect time — defense against compromised DB records
  if (!isValidUrl(order.delivery_url)) {
    return NextResponse.json({ error: "Invalid delivery URL" }, { status: 500 });
  }

  return NextResponse.redirect(order.delivery_url);
}
