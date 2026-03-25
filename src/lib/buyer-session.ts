/**
 * Two signed httpOnly cookies for buyer access:
 *
 * 1. `orders_session` — full access to the orders list + any single order.
 *    Set ONLY after the buyer verifies via the orders-lookup OTP flow (/orders page).
 *    Cookie format: `email|expiresAt|hmac`
 *
 * 2. `purchase_session` — scoped access to ONE specific order after purchase OTP.
 *    Does NOT grant access to the orders list.
 *    Cookie format: `email|orderId|expiresAt|hmac`
 *
 * Both are signed with STRIPE_SECRET_KEY.
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";

const SIGNING_KEY =
  process.env.STRIPE_SECRET_KEY ??
  crypto.randomBytes(32).toString("hex");

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const PURCHASE_TTL_MS = 60 * 60 * 1000; // 1 hour

function hmac(data: string): string {
  return crypto.createHmac("sha256", SIGNING_KEY).update(data).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ── orders_session (full list access) ────────────────────────────────────────

export function buildSessionCookie(email: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${email}|${expiresAt}`;
  return `${payload}|${hmac(payload)}`;
}

export async function setOrdersSession(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("orders_session", buildSessionCookie(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

/** Returns the verified email from an `orders_session` cookie, or null. */
export function getVerifiedEmail(
  cookieValue: string | undefined,
): string | null {
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

// ── purchase_session (scoped to one order) ───────────────────────────────────

export async function setPurchaseSession(
  email: string,
  orderId: string,
): Promise<void> {
  const expiresAt = Date.now() + PURCHASE_TTL_MS;
  const payload = `${email}|${orderId}|${expiresAt}`;
  const cookieValue = `${payload}|${hmac(payload)}`;
  const cookieStore = await cookies();
  cookieStore.set("purchase_session", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: PURCHASE_TTL_MS / 1000,
    path: "/",
  });
}

/**
 * Returns the verified email from a `purchase_session` cookie if it matches
 * the expected orderId, or null.
 */
export function getVerifiedPurchaseEmail(
  cookieValue: string | undefined,
  expectedOrderId: string,
): string | null {
  if (!cookieValue) return null;
  const lastPipe = cookieValue.lastIndexOf("|");
  if (lastPipe === -1) return null;
  const payload = cookieValue.slice(0, lastPipe);
  const signature = cookieValue.slice(lastPipe + 1);
  if (!timingSafeEqual(hmac(payload), signature)) return null;
  // payload = email|orderId|expiresAt
  const parts = payload.split("|");
  if (parts.length !== 3) return null;
  const [email, orderId, expiresAtStr] = parts;
  if (orderId !== expectedOrderId) return null;
  if (Date.now() > parseInt(expiresAtStr, 10)) return null;
  return email;
}
