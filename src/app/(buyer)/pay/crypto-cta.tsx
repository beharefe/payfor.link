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
