import { createBuyerToken } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { FROM_EMAIL, resend } from "@unseallink/lib/resend";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let email: string;
  try {
    const body = await request.json();
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
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
    const link = `${appUrl}/api/orders/verify?token=${token}`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your orders sign-in link",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="font-size:20px;font-weight:500;margin:0 0 8px;">Sign in to your orders</h2>
          <p style="color:#666;margin:0 0 20px;">Click the button below to view all your purchases.</p>
          <a href="${link}" style="display:inline-block;background:#111111;color:#ffffff;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:500;font-size:16px;">
            View my orders →
          </a>
          <p style="color:#aaa;font-size:13px;margin-top:20px;">
            This link expires in 7 days.<br>
            Can't click the button? Copy this link:<br>
            <span style="color:#666;">${link}</span>
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
