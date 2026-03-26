import { render } from "@react-email/render";
import { MagicLinkEmail } from "@unseallink/emails/magic-link";
import { createBuyerToken } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { FROM_EMAIL, resend } from "@unseallink/lib/resend";
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your orders sign-in link",
      html: await render(MagicLinkEmail({ link })),
    });
  }

  return NextResponse.json({ ok: true });
}
