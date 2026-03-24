import crypto from "node:crypto";
import { setOrdersSession } from "@unseallink/lib/buyer-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SIGNING_KEY = process.env.STRIPE_SECRET_KEY ?? "dev-secret";

function sign(data: string): string {
  return crypto.createHmac("sha256", SIGNING_KEY).update(data).digest("hex");
}

function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>).code;
  const code = typeof raw === "string" ? raw.trim() : null;

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const otpCookie = cookieStore.get("orders_otp")?.value;

  if (!otpCookie) {
    return NextResponse.json(
      { error: "Session expired. Please request a new code." },
      { status: 400 },
    );
  }

  // Format: email|otpHash|expiresAt|signature
  const pipeCount = (otpCookie.match(/\|/g) ?? []).length;
  if (pipeCount !== 3) {
    return NextResponse.json(
      { error: "Invalid session. Please request a new code." },
      { status: 400 },
    );
  }

  const lastPipe = otpCookie.lastIndexOf("|");
  const payload = otpCookie.slice(0, lastPipe);
  const signature = otpCookie.slice(lastPipe + 1);

  if (!timingSafeEquals(sign(payload), signature)) {
    return NextResponse.json(
      { error: "Invalid session. Please request a new code." },
      { status: 400 },
    );
  }

  const [email, otpHash, expiresAtStr] = payload.split("|");

  if (Date.now() > parseInt(expiresAtStr, 10)) {
    return NextResponse.json(
      { error: "Code expired. Please request a new one." },
      { status: 400 },
    );
  }

  const inputHash = crypto.createHash("sha256").update(code).digest("hex");
  if (!timingSafeEquals(inputHash, otpHash)) {
    return NextResponse.json(
      { error: "Incorrect code. Please try again." },
      { status: 400 },
    );
  }

  cookieStore.delete("orders_otp");
  await setOrdersSession(email);

  return NextResponse.json({ success: true, email });
}
