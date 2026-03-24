import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { resend, FROM_EMAIL } from "@unseallink/lib/resend";

const SIGNING_KEY = process.env.STRIPE_SECRET_KEY ?? "dev-secret";

function sign(data: string): string {
  return crypto.createHmac("sha256", SIGNING_KEY).update(data).digest("hex");
}

export async function POST(request: Request) {
  console.log("[send-code] route hit");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.error("[send-code] Failed to parse request body");
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>).email;
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : null;

  if (!email || !email.includes("@")) {
    console.error("[send-code] Invalid email:", raw);
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 min

  const payload = `${email}|${otpHash}|${expiresAt}`;
  const cookieValue = `${payload}|${sign(payload)}`;

  console.log("[send-code] Sending OTP via Resend", {
    to: email,
    from: FROM_EMAIL,
    resend_api_key_set: !!process.env.RESEND_API_KEY,
    resend_from_email_set: !!process.env.RESEND_FROM_EMAIL,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

  let emailError: unknown = null;
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your orders verification code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="font-size:20px;font-weight:500;margin:0 0 8px;">Verify your email</h2>
          <p style="color:#666;margin:0 0 20px;">Enter this code to view your orders:</p>
          <p style="font-size:36px;font-weight:700;letter-spacing:8px;margin:0 0 20px;font-family:monospace;">${otp}</p>
          <p style="color:#aaa;font-size:13px;margin:0;">Expires in 15 minutes. Via <a href="${appUrl}" style="color:#aaa;">unseal.link</a></p>
        </div>
      `,
    });
    emailError = result.error;
    console.log("[send-code] Resend result:", JSON.stringify(result));
  } catch (err) {
    console.error("[send-code] Resend threw exception:", err);
    return NextResponse.json({ error: "Failed to send code. Please try again." }, { status: 500 });
  }

  if (emailError) {
    console.error("[send-code] Resend returned error:", JSON.stringify(emailError));
    return NextResponse.json({ error: "Failed to send code. Please try again." }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set("orders_otp", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
