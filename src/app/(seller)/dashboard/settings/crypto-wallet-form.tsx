"use client";

import { saveSolanaWallet } from "@unseallink/app/actions/settings";
import { Input } from "@unseallink/components/ui/input";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  currentWallet: string | null;
};

export function CryptoWalletForm({ currentWallet }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<string>("");

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    if (!currentWallet) return;
    const newAddress = new FormData(e.currentTarget)
      .get("solana_wallet_address")
      ?.toString()
      .trim() ?? "";
    if (newAddress === currentWallet) return;
    e.preventDefault();
    setPendingValue(newAddress);
    setConfirmOpen(true);
  }

  function confirmChange() {
    setConfirmOpen(false);
    confirmedRef.current = true;
    formRef.current?.requestSubmit();
  }

  const isRemoving = !pendingValue;

  return (
    <>
      {/* What crypto payments enable */}
      <div className="rounded-xl bg-muted/40 border border-border px-4 py-3.5 mb-5 space-y-2">
        <p className="text-sm font-medium text-foreground">Accept on-chain payments</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Buyers pay in USDC on Solana directly to your wallet — no conversion, no intermediary, no
          delays. Funds settle on-chain the moment the transaction confirms. Supports both direct
          Solana wallet payments and{" "}
          <a
            href="https://actioncode.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            Action Codes
          </a>
          {" "}(pay from any Solana wallet without a browser extension).
        </p>
        <div className="flex flex-wrap gap-3 pt-0.5">
          {[
            "USDC · SOL",
            "1% platform fee",
            "Instant on-chain settlement",
            "No intermediary",
          ].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-background border border-border text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
            spellCheck={false}
            autoComplete="off"
            className="rounded-xl h-11 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            You will receive payouts directly to your Solana wallet — we never hold your funds.
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

      {/* Confirmation dialog — only shown when changing or removing an existing wallet */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">
                  {isRemoving ? "Remove wallet address?" : "Change wallet address?"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Cancel"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRemoving
                ? "Crypto payment options will be hidden from your paywall pages until you add a wallet address again."
                : "Future crypto payments will be sent to the new address. Already-completed transactions are not affected."}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 border border-border rounded-full text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmChange}
                className="flex-1 py-2.5 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Yes, {isRemoving ? "remove" : "change"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
