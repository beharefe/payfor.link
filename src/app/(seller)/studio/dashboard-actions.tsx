"use client";

import {
  initiateStripeConnect,
  requestWithdraw,
} from "@payforlink/app/actions/stripe-connect";

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
