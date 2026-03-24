/**
 * Signed httpOnly cookie that proves a buyer has verified ownership of their email.
 * Used by the orders lookup page. Set automatically after post-purchase OTP verification
 * so buyers don't have to re-authenticate.
 *
 * Cookie format: `email|expiresAt|hmac`
 * Signed with STRIPE_SECRET_KEY (already in all envs, no extra secret needed).
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";

const SIGNING_KEY = process.env.STRIPE_SECRET_KEY ?? "dev-secret";
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const COOKIE_NAME = "orders_session";

function hmac(data: string): string {
  return crypto.createHmac("sha256", SIGNING_KEY).update(data).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function buildSessionCookie(email: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${email}|${expiresAt}`;
  return `${payload}|${hmac(payload)}`;
}

export async function setOrdersSession(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, buildSessionCookie(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export function getVerifiedEmail(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const lastPipe = cookieValue.lastIndexOf("|");
  if (lastPipe === -1) return null;
  const payload = cookieValue.slice(0, lastPipe);
  const signature = cookieValue.slice(lastPipe + 1);
  if (!timingSafeEqual(hmac(payload), signature)) return null;
  const pipeIdx = payload.indexOf("|");
  if (pipeIdx === -1) return null;
  const email = payload.slice(0, pipeIdx);
  const expiresAt = parseInt(payload.slice(pipeIdx + 1), 10);
  if (Date.now() > expiresAt) return null;
  return email;
}
