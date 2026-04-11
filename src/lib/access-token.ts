import crypto from "node:crypto";

const EXPIRY_HOURS = 24;

export function generateAccessToken(): {
  raw: string;
  hash: string;
  expiresAt: Date;
} {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);
  return { raw, hash, expiresAt };
}

export function hashAccessToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
