"use client";

import {
  initiateStripeConnect,
  requestWithdraw,
} from "@unseallink/app/actions/stripe-connect";
import { signOut } from "@unseallink/app/actions/auth";

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
      <button type="submit" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        Sign out
      </button>
    </form>
  );
}
