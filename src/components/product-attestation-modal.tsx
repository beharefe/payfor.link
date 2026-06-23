"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@unseallink/components/ui/dialog";
import Link from "next/link";
import { useState } from "react";

export type AttestationAction =
  | "publish"
  | "update_destination"
  | "update_destination_has_sales"
  | "continue";

const ACTION_BUTTON_TEXT: Record<AttestationAction, string> = {
  publish: "I confirm and publish",
  update_destination: "I confirm and update access",
  update_destination_has_sales: "Submit link change for review",
  continue: "I confirm and continue",
};

const CHECKBOXES = [
  "I confirm that this product delivers the access described on the listing page.",
  "I confirm that I own this content or have the legal right to sell access to it.",
  "I confirm that the access link is working and does not require buyers to provide passwords, seed phrases, private keys, payment details, or other sensitive information outside the checkout flow.",
  "I confirm that this product does not contain adult content, illegal content, pirated material, malware, phishing, gambling/betting content, investment signals, deceptive claims, or other prohibited content.",
  "I understand that if this product is broken, deceptive, prohibited, unavailable, or materially different from the listing, unseal may pause sales, remove the listing from discovery, refund buyers, delay or hold payouts, suspend my account, and recover refund or dispute-related costs from my available balance where permitted.",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: AttestationAction;
  onConfirm: () => void;
};

export function ProductAttestationModal({
  open,
  onOpenChange,
  action,
  onConfirm,
}: Props) {
  const [checked, setChecked] = useState<boolean[]>(
    () => Array(CHECKBOXES.length).fill(false),
  );

  const allChecked = checked.every(Boolean);

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setChecked(Array(CHECKBOXES.length).fill(false));
    }
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!allChecked) return;
    onConfirm();
    handleOpenChange(false);
  }

  const hasSalesWarning = action === "update_destination_has_sales";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Confirm your access product</DialogTitle>
          <DialogDescription>
            Before publishing, please confirm that this product is safe, accurate,
            and ready for buyers.
          </DialogDescription>
        </DialogHeader>

        {hasSalesWarning && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            Changing the access link will pause this product pending review.
            Existing buyers keep the access they already purchased.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {CHECKBOXES.map((text, i) => (
            <label
              key={i}
              className="flex gap-3 cursor-pointer group select-none"
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="mt-0.5 size-4 shrink-0 cursor-pointer accent-foreground"
              />
              <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                {text}
              </span>
            </label>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          By confirming, you agree to unseal's{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Terms
          </Link>{" "}
          and seller responsibility rules.
        </p>

        <DialogFooter className="flex-row justify-end gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-full"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allChecked}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {ACTION_BUTTON_TEXT[action]}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
