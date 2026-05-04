"use client";

import { createCryptoCheckout } from "@unseallink/app/actions/crypto-checkout";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed border border-border"
    >
      {pending && <Loader2 className="animate-spin size-4 shrink-0" />}
      {pending ? "Redirecting…" : "Continue to crypto payment"}
    </button>
  );
}

export function CryptoCTA({ linkId }: { linkId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [error, formAction] = useActionState(submitCryptoCheckout, null);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        Pay with SOL / USDC via Helio ↓
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="linkId" value={linkId} />
      <input
        name="email"
        type="email"
        required
        autoFocus
        placeholder="your@email.com"
        className="block w-full px-3 py-2.5 border border-input rounded-xl text-sm bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      />
      <SubmitButton />
      {error && <p className="text-destructive text-xs">{error}</p>}
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
