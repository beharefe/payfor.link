import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely serialize any thrown value or error object for logging.
 * - Error instance → message string
 * - Plain object (e.g. Resend/Stripe SDK errors) → JSON
 * - Anything else → String()
 */
export function serializeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
