import crypto from "node:crypto";

export const ACCESS_TOKEN_DAYS = 7;
export const SESSION_DAYS = 30;

const ACCESS_TOKEN_TTL = ACCESS_TOKEN_DAYS * 24 * 60 * 60;
const SESSION_TTL = SESSION_DAYS * 24 * 60 * 60;

function secret() {
  const s = process.env.BUYER_SESSION_SECRET;
  if (!s) throw new Error("BUYER_SESSION_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function encode(email: string, expiresInSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): { email: string } | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!timingSafeEqual(sign(payload), sig)) return null;
    const { email, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!email || !exp) return null;
    if (Math.floor(Date.now() / 1000) > exp) return null;
    return { email };
  } catch {
    return null;
  }
}

/** Create a short-lived token to include in the email link (7 days). */
export function createBuyerToken(email: string): string {
  return encode(email, ACCESS_TOKEN_TTL);
}

/** Verify a token from the email link. Returns null if invalid or expired. */
export function verifyBuyerToken(token: string): { email: string } | null {
  return decode(token);
}

/** Create the value for the buyer_session cookie (30 days). */
export function createSessionValue(email: string): string {
  return encode(email, SESSION_TTL);
}

/** Verify the buyer_session cookie value. Returns null if invalid or expired. */
export function verifySessionValue(value: string): { email: string } | null {
  return decode(value);
}
