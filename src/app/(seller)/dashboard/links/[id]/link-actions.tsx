"use client";

import { archiveProduct, deleteProduct, submitToDiscover } from "@unseallink/app/actions/product";
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
import { HandCoins, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ArchiveButton({
  id,
  isArchived,
  totalSales,
  totalRevenue,
}: {
  id: string;
  isArchived: boolean;
  totalSales?: number;
  totalRevenue?: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const hasSales = (totalSales ?? 0) > 0;

  function handleConfirm() {
    startTransition(async () => {
      const result = await archiveProduct(id);
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  // Reactivating: no confirmation needed
  if (isArchived) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => startTransition(async () => {
            const result = await archiveProduct(id);
            if ("error" in result) setError(result.error);
          })}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-transparent"
        >
          {isPending && <Loader2 className="animate-spin size-3.5 shrink-0" />}
          {isPending ? "Saving…" : "Reactivate"}
        </button>
        {error && <span className="text-destructive text-sm">{error}</span>}
      </span>
    );
  }

  // Archiving with sales: show revenue impact dialog
  return (
    <span className="inline-flex items-center gap-2">
      <Dialog open={open} onOpenChange={(v) => { if (!isPending) { setOpen(v); if (!v) setError(null); } }}>
        <DialogTrigger className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors bg-transparent">
          Archive
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Archive this link?</DialogTitle>
            <DialogDescription>
              {hasSales
                ? "This link will stop accepting new payments. Existing buyers keep their access."
                : "This link will stop accepting payments. You can reactivate it any time."}
            </DialogDescription>
          </DialogHeader>
          {hasSales && (
            <div className="rounded-xl bg-muted px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-foreground">Sales you'd be pausing</p>
              <div className="flex gap-6 pt-0.5">
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-sm font-medium text-foreground">{totalSales}</p>
                </div>
                {(totalRevenue ?? 0) > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue earned</p>
                    <p className="text-sm font-medium text-foreground">${(totalRevenue ?? 0).toFixed(2)}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground pt-1">You can reactivate this link any time.</p>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Keep selling</DialogClose>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin size-3.5 shrink-0" />}
              {isPending ? "Archiving…" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

export function SubmitToDiscoverButton({
  id,
  publicStatus,
}: {
  id: string;
  publicStatus: "pending" | "approved" | "rejected" | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (publicStatus === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
        Listed on Discover
      </span>
    );
  }

  if (publicStatus === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full">
        Pending review
      </span>
    );
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await submitToDiscover(id);
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Dialog open={open} onOpenChange={(v) => { if (!isPending) { setOpen(v); if (!v) setError(null); } }}>
        <DialogTrigger className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors bg-transparent">
          {publicStatus === "rejected" ? "Resubmit to Discover" : "Submit to Discover"}
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Submit to unseal Discover?</DialogTitle>
            <DialogDescription>
              Your product will be reviewed against unseal's public listing guidelines.
              It will not appear on Discover until approved. Existing buyers are not affected.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground leading-relaxed space-y-1">
            <p>By submitting, you confirm this product is accurate, legal, and ready for public discovery.</p>
            <p>unseal may approve, reject, or remove public listings at any time per the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms</a>.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin size-3.5 shrink-0" />}
              {isPending ? "Submitting…" : "Submit for review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [success, setSuccess] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await refundPurchase(orderId, note.trim() || undefined);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        setNote("");
        // Short delay so user sees the success state, then close + reload
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          router.push(window.location.pathname);
        }, 1200);
      }
    });
  }

  function handleOpenChange(val: boolean) {
    if (!isPending) {
      setOpen(val);
      if (!val) { setError(null); setSuccess(false); setNote(""); }
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          className="inline-flex items-center justify-center p-1.5 rounded-full text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted transition-colors bg-transparent border-none"
          title="Refund this order"
        >
          <HandCoins className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">Refund</span>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          {success ? (
            <div className="py-4 text-center">
              <p className="text-2xl mb-2">✓</p>
              <p className="font-medium text-foreground">Refund issued</p>
              <p className="text-sm text-muted-foreground mt-1">
                The buyer will receive their money back shortly.
              </p>
            </div>
          ) : (
            <>
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
                <Button onClick={handleConfirm} disabled={isPending}>
                  {isPending && <Loader2 className="animate-spin size-3.5 shrink-0" />}
                  {isPending ? "Processing…" : "Issue refund"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </span>
  );
}
