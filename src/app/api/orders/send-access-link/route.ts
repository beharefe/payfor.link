import { createBuyerToken } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { sendBuyerSignInEmail } from "@unseallink/lib/email";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let email: string;
  let oid: string | undefined;
  try {
    const body = await request.json();
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    oid = typeof body.oid === "string" && body.oid.trim() ? body.oid.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Always return ok — don't reveal whether an account/orders exist for this email
  const reqUrl = new URL(request.url);
  const appUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  const service = createServiceClient();
  const { data: orders } = await service
    .from(TABLES.ORDERS)
    .select("id")
    .eq("buyer_email", email)
    .limit(1);

  if (orders?.length) {
    const token = createBuyerToken(email);
    const next = oid ? `&next=/orders/${oid}` : "";
    const link = `${appUrl}/api/orders/verify?token=${token}${next}`;
    await sendBuyerSignInEmail({ to: email, link });
  }

  return NextResponse.json({ ok: true });
}
