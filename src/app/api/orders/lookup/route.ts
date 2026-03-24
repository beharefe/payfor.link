import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getVerifiedEmail } from "@unseallink/lib/buyer-session";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { TABLES } from "@unseallink/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const verifiedEmail = getVerifiedEmail(cookieStore.get("orders_session")?.value);

  if (!verifiedEmail || verifiedEmail !== email) {
    return NextResponse.json({ error: "Not verified" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: orders, error } = await service
    .from(TABLES.ORDERS)
    .select("id, product_title, price_paid, currency, created_at, status")
    .eq("buyer_email", email)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  return NextResponse.json({ orders: orders ?? [] });
}
