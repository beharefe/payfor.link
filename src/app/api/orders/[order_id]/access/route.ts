import { verifySessionValue } from "@unseallink/lib/buyer-token";
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
    .select("buyer_email, delivery_url, status")
    .eq("id", order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status === "refunded") {
    return NextResponse.redirect(new URL(`/orders/${order_id}`, appUrl));
  }

  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("buyer_session")?.value ?? "");

  if (!session || session.email.toLowerCase() !== order.buyer_email.toLowerCase()) {
    return NextResponse.redirect(
      new URL(`/orders?next=/orders/${order_id}`, appUrl),
    );
  }

  if (!isValidUrl(order.delivery_url)) {
    return NextResponse.json({ error: "Invalid delivery URL" }, { status: 500 });
  }

  return NextResponse.redirect(order.delivery_url);
}
