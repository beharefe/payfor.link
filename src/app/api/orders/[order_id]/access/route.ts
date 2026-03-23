import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@unseallink/lib/supabase/server";
import { TABLES } from "@unseallink/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ order_id: string }> },
) {
  const { order_id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", appUrl));
  }

  const service = createServiceClient();
  const { data: order } = await service
    .from(TABLES.ORDERS)
    .select("buyer_email, delivery_url, status")
    .eq("id", order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.buyer_email !== user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status === "refunded") {
    return NextResponse.redirect(new URL(`/orders/${order_id}`, appUrl));
  }

  return NextResponse.redirect(order.delivery_url);
}
