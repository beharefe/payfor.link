import { trackServer } from "@unseallink/lib/amplitude-server";
import { TABLES } from "@unseallink/lib/db";
import { isValidUrl } from "@unseallink/lib/product-utils";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ order_id: string }> },
) {
  const { order_id } = await params;
  const url = new URL(_request.url);
  const appUrl = `${url.protocol}//${url.host}`;

  const service = createServiceClient();
  const { data: order } = await service
    .from(TABLES.ORDERS)
    .select("buyer_email, delivery_url, status, product_id")
    .eq("id", order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status === "refunded") {
    return NextResponse.redirect(new URL(`/orders?oid=${order_id}`, appUrl));
  }

  if (!isValidUrl(order.delivery_url)) {
    return NextResponse.json({ error: "Invalid delivery URL" }, { status: 500 });
  }

  // Order UUID is 122-bit random — non-guessable. Possession proves purchase.
  void trackServer(
    {
      name: "Content Revealed",
      props: { link_id: order.product_id, order_id, content_type: "link" },
    },
    order.buyer_email,
  );

  return NextResponse.redirect(order.delivery_url);
}
