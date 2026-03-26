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
        className="px-6 py-3 text-base cursor-pointer"
      >
        Pay & get access
      </button>
      {error && <p className="text-destructive mt-2">{error}</p>}
    </form>
  );
}
