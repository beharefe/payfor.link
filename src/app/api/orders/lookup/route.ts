import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { TABLES } from "@unseallink/lib/db";

const SIGNING_KEY = process.env.STRIPE_SECRET_KEY ?? "dev-secret";

function sign(data: string): string {
  return crypto.createHmac("sha256", SIGNING_KEY).update(data).digest("hex");
}

function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function getVerifiedEmail(sessionCookie: string | undefined): string | null {
  if (!sessionCookie) return null;

  // Format: email|expiresAt|signature
  const lastPipe = sessionCookie.lastIndexOf("|");
  if (lastPipe === -1) return null;

  const payload = sessionCookie.slice(0, lastPipe);
  const signature = sessionCookie.slice(lastPipe + 1);

  if (!timingSafeEquals(sign(payload), signature)) return null;

  const pipeIdx = payload.indexOf("|");
  if (pipeIdx === -1) return null;

  const email = payload.slice(0, pipeIdx);
  const expiresAt = parseInt(payload.slice(pipeIdx + 1), 10);

  if (Date.now() > expiresAt) return null;

  return email;
}

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
