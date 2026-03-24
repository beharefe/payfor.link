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
        style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
      >
        Pay & get access
      </button>
      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
    </form>
  );
}
