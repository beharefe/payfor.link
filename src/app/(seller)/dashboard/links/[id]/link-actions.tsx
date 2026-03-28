"use client";

import { archiveProduct, deleteProduct } from "@unseallink/app/actions/product";
import { refundPurchase } from "@unseallink/app/actions/refund";
import { Button } from "@unseallink/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unseallink/components/ui/dialog";
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
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteProduct(id);
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-destructive/30 rounded-full text-sm font-medium text-destructive cursor-pointer hover:bg-destructive/10 transition-colors bg-transparent"
        >
          Delete
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete this link?</DialogTitle>
            <DialogDescription>
              Buyers who already purchased will still have access to their content. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending && <Loader2 className="animate-spin size-3.5 shrink-0" />}
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await refundPurchase(orderId, note.trim() || undefined);
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
        setNote("");
        router.refresh();
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          className="inline-flex items-center justify-center p-1.5 rounded-full text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted transition-colors bg-transparent border-none"
          title="Refund this order"
        >
          <RotateCcw className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">Refund</span>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Refund this order?</DialogTitle>
            <DialogDescription>
              A full refund will be issued to <span className="font-medium text-foreground">{buyerEmail}</span>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="refund-note" className="text-xs font-medium text-muted-foreground">
              Note <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="refund-note"
              rows={2}
              placeholder="Reason for refund…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending && <Loader2 className="animate-spin size-3.5 shrink-0" />}
              {isPending ? "Processing…" : "Issue refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </span>
  );
}
