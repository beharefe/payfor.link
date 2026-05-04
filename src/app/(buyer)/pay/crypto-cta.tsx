"use client";

import { createCryptoCheckout } from "@unseallink/app/actions/crypto-checkout";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

async function submitCryptoCheckout(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const linkId = formData.get("linkId")?.toString();
  const email = formData.get("email")?.toString();
  if (!linkId || !email) return "Missing required fields.";
  const result = await createCryptoCheckout(linkId, email);
  if ("error" in result) return result.error;
  return null;
}

function ArrowSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Continue"
      className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
    >
      {pending ? (
        <Loader2 className="animate-spin size-4 shrink-0" />
      ) : (
        <ArrowRight className="size-4 shrink-0" />
      )}
    </button>
  );
}

export function CryptoCTA({ linkId }: { linkId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [error, formAction] = useActionState(submitCryptoCheckout, null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => {
          setExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-border rounded-full text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <svg viewBox="0 0 128 128" className="h-4 w-4 shrink-0" aria-hidden="true">
          <defs>
            <linearGradient id="sol-g" x1="0" y1="96" x2="128" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#9945FF" />
              <stop offset="0.5" stopColor="#43B4CA" />
              <stop offset="1" stopColor="#19FB9B" />
            </linearGradient>
          </defs>
          <path d="M108.53 75.69L90.81 94.69C90.43 95.1 89.96 95.43 89.45 95.66C88.93 95.88 88.37 96 87.81 96H3.81C3.41 96 3.02 95.88 2.68 95.66C2.35 95.44 2.08 95.13 1.92 94.76C1.76 94.4 1.71 93.99 1.78 93.6C1.85 93.2 2.03 92.83 2.3 92.54L20 73.54C20.38 73.13 20.85 72.8 21.36 72.57C21.88 72.35 22.44 72.23 23 72.23H107C107.4 72.22 107.8 72.33 108.14 72.55C108.48 72.77 108.75 73.08 108.92 73.45C109.08 73.82 109.13 74.23 109.06 74.63C108.99 75.03 108.81 75.39 108.53 75.69ZM90.81 37.42C90.43 37.01 89.96 36.68 89.45 36.46C88.93 36.23 88.37 36.11 87.81 36.11H3.81C3.41 36.11 3.02 36.23 2.68 36.45C2.35 36.67 2.08 36.98 1.92 37.35C1.76 37.71 1.71 38.12 1.78 38.51C1.85 38.91 2.03 39.28 2.3 39.57L20 58.58C20.38 58.99 20.85 59.32 21.36 59.54C21.88 59.77 22.44 59.89 23 59.89H107C107.4 59.89 107.79 59.77 108.12 59.55C108.46 59.33 108.72 59.02 108.88 58.65C109.04 58.28 109.09 57.88 109.02 57.48C108.95 57.09 108.77 56.72 108.5 56.43L90.81 37.42ZM3.81 23.77H87.81C88.37 23.77 88.93 23.65 89.45 23.43C89.96 23.2 90.43 22.87 90.81 22.46L108.53 3.46C108.81 3.17 108.99 2.8 109.06 2.4C109.13 2 109.08 1.59 108.92 1.22C108.75 0.85 108.48 0.54 108.14 0.32C107.8 0.1 107.4 -0.01 107 0H23C22.44 0 21.88 0.12 21.36 0.34C20.85 0.57 20.38 0.9 20 1.31L2.3 20.31C2.03 20.6 1.85 20.97 1.78 21.37C1.71 21.76 1.76 22.17 1.92 22.53C2.08 22.9 2.35 23.21 2.68 23.43C3.02 23.65 3.41 23.77 3.81 23.77Z" fill="url(#sol-g)" />
        </svg>
        Pay with Solana
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <form action={formAction}>
        <input type="hidden" name="linkId" value={linkId} />
        <div className="relative">
          <input
            ref={inputRef}
            name="email"
            type="email"
            required
            autoFocus
            placeholder="your@email.com"
            className="block w-full pl-4 pr-12 py-2.5 border border-input rounded-full text-sm bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
          />
          <ArrowSubmitButton />
        </div>
        {error && <p className="text-destructive text-xs px-1">{error}</p>}
      </form>
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
      >
        Cancel
      </button>
    </div>
  );
}
