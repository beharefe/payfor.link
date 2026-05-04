"use client";

import { saveSolanaWallet } from "@unseallink/app/actions/settings";
import { Input } from "@unseallink/components/ui/input";
import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

type Props = {
  currentWallet: string | null;
};

export function CryptoWalletForm({ currentWallet }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const result = await saveSolanaWallet(formData);
      if ("error" in result) return result.error;
      return "saved";
    },
    null,
  );

  useEffect(() => {
    if (state === "saved") toast.success("Wallet saved");
    else if (state) toast.error(state);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="solana_wallet_address"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Solana wallet address
        </label>
        <Input
          id="solana_wallet_address"
          name="solana_wallet_address"
          type="text"
          defaultValue={currentWallet ?? ""}
          maxLength={44}
          placeholder="e.g. 7xKX…"
          spellCheck={false}
          autoComplete="off"
          className="rounded-xl h-11 font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Buyers pay in USDC on Solana. Proceeds go directly to this wallet.
          Leave empty to disable crypto payments.
        </p>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground border-none rounded-full font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {isPending && <Loader2 className="animate-spin size-4 shrink-0" />}
        {isPending ? "Saving…" : "Save wallet"}
      </button>
    </form>
  );
}
