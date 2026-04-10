"use client";

import { signOut } from "@unseallink/app/actions/auth";
import {
  initiateStripeConnect,
  requestWithdraw,
} from "@unseallink/app/actions/stripe-connect";
import { ArrowUpRight, Loader2, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

export function InitiateStripeConnectButton({ label = "Connect Stripe" }: { label?: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <form
      action={initiateStripeConnect}
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => initiateStripeConnect());
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed border-none shrink-0"
      >
        {isPending && <Loader2 className="animate-spin size-4 shrink-0" />}
        {isPending ? "Redirecting..." : label}
      </button>
    </form>
  );
}

export function WithdrawButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <form
      action={requestWithdraw}
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => requestWithdraw());
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground border-none rounded-full text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
      >
        {isPending && <Loader2 className="animate-spin size-3 shrink-0" />}
        {isPending ? "..." : "Payout"}
        {!isPending && <ArrowUpRight className="size-3 shrink-0" />}
      </button>
    </form>
  );
}

export function AvatarDropdown({
  initial,
  avatarUrl,
}: {
  initial: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium text-foreground shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-border transition-all"
        aria-label="Account menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 border border-border rounded-2xl bg-card shadow-lg overflow-hidden z-50">
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors no-underline"
          >
            <Settings className="size-4 shrink-0" aria-hidden="true" />
            Settings
          </Link>
          <div className="border-t border-border" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(() => signOut());
            }}
          >
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer bg-transparent border-none text-left disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="animate-spin size-4 shrink-0" />
              ) : (
                <LogOut className="size-4 shrink-0" aria-hidden="true" />
              )}
              {isPending ? "Signing out…" : "Sign out"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

