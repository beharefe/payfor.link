"use client";

import { createCheckoutSession } from "@unseallink/app/actions/checkout";
import { useActionState } from "react";

async function submitCheckout(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const linkId = formData.get("linkId")?.toString();
  if (!linkId) return "Missing product.";
  const result = await createCheckoutSession(linkId);
  if ("error" in result) return result.error;
  return null;
}

export function PaywallCTA({ linkId }: { linkId: string }) {
  const [error, formAction] = useActionState(submitCheckout, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="linkId" value={linkId} />
      <button
        type="submit"
        className="w-full px-6 py-3.5 bg-primary text-primary-foreground rounded-full text-base font-medium cursor-pointer hover:opacity-90 transition-opacity border-none"
      >
        Pay &amp; unseal
      </button>
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </form>
  );
}
