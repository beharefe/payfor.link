"use client";

import { signOut } from "@unseallink/app/actions/auth";
import {
  initiateStripeConnect,
  requestWithdraw,
} from "@unseallink/app/actions/stripe-connect";
import { ArrowUpRight, Loader2, LogOut } from "lucide-react";
import { useTransition } from "react";

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

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <form
      action={signOut}
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => signOut());
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60 bg-transparent border-none p-1 cursor-pointer"
      >
        {isPending ? <Loader2 className="animate-spin size-4 shrink-0" /> : <LogOut className="size-4 shrink-0" />}
        <span className="hidden sm:inline">{isPending ? "Signing out..." : "Sign out"}</span>
      </button>
    </form>
  );
}
