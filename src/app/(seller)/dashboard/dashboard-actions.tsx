"use client";

import { signOut } from "@unseallink/app/actions/auth";
import {
  initiateStripeConnect,
  requestWithdraw,
} from "@unseallink/app/actions/stripe-connect";

export function InitiateStripeConnectButton() {
  return (
    <form action={initiateStripeConnect}>
      <button type="submit">Connect Stripe</button>
    </form>
  );
}

export function WithdrawButton() {
  return (
    <form action={requestWithdraw}>
      <button type="submit">Manage payouts</button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="bg-transparent border-none p-0 cursor-pointer"
      >
        Sign out
      </button>
    </form>
  );
}
