"use client";

import { createCheckoutSession } from "@unseallink/app/actions/checkout";
import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-full text-base font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed border-none"
    >
      {pending && <Loader2 className="animate-spin size-4 shrink-0" />}
      {pending ? "Redirecting to payment…" : "Pay & unseal"}
    </button>
  );
}

export function PaywallCTA({ linkId }: { linkId: string }) {
  const [error, formAction] = useActionState(submitCheckout, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="linkId" value={linkId} />
      <SubmitButton />
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </form>
  );
}
