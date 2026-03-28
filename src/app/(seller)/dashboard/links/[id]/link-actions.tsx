"use client";

import { archiveProduct, deleteProduct } from "@unseallink/app/actions/product";
import { refundPurchase } from "@unseallink/app/actions/refund";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ArchiveButton({
  id,
  isArchived,
}: {
  id: string;
  isArchived: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await archiveProduct(id);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-transparent"
      >
        {isPending && <Loader2 className="animate-spin size-3.5 shrink-0" />}
        {isPending ? "Saving…" : isArchived ? "Reactivate" : "Archive"}
      </button>
      {error && <span className="text-destructive text-sm">{error}</span>}
    </span>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("Delete this link? Buyers who already purchased will still have access.")) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-4 py-2 border border-destructive/30 rounded-full text-sm font-medium text-destructive cursor-pointer hover:bg-destructive/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-transparent"
      >
        {isPending && <Loader2 className="animate-spin size-3.5 shrink-0" />}
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="text-destructive text-sm">{error}</span>}
    </span>
  );
}

export function RefundButton({
  orderId,
  buyerEmail,
}: {
  orderId: string;
  buyerEmail: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm(`Refund order for ${buyerEmail}? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await refundPurchase(orderId);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title="Refund this order"
        className="inline-flex items-center gap-1.5 p-1.5 rounded-full text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-transparent border-none"
      >
        {isPending ? (
          <Loader2 className="animate-spin size-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <RotateCcw className="size-3.5 shrink-0" aria-hidden="true" />
        )}
        <span className="sr-only">{isPending ? "Processing refund…" : "Refund"}</span>
      </button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
}
