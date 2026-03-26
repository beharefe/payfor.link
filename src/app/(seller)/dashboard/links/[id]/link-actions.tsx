"use client";

import { archiveProduct, deleteProduct } from "@unseallink/app/actions/product";
import { refundPurchase } from "@unseallink/app/actions/refund";
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
    <span>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="px-3 py-1.5 cursor-pointer"
      >
        {isPending ? "..." : isArchived ? "Reactivate" : "Archive"}
      </button>
      {error && (
        <span className="text-destructive ml-2 text-[0.85rem]">
          {error}
        </span>
      )}
    </span>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        "Delete this link? Buyers who already purchased will still have access.",
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <span>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="px-3 py-1.5 cursor-pointer text-destructive"
      >
        {isPending ? "..." : "Delete"}
      </button>
      {error && (
        <span className="text-destructive ml-2 text-[0.85rem]">
          {error}
        </span>
      )}
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm(`Refund order for ${buyerEmail}? This cannot be undone.`))
      return;
    startTransition(async () => {
      const result = await refundPurchase(orderId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <span>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="px-2 py-1 text-[0.8125rem] cursor-pointer"
      >
        {isPending ? "..." : "Refund"}
      </button>
      {error && (
        <span className="text-destructive ml-2 text-[0.8rem]">
          {error}
        </span>
      )}
    </span>
  );
}
