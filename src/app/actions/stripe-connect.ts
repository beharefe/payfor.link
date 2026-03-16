"use server";

import { redirect } from "next/navigation";
import {
  getStripeConnectAccountLinkUrl,
  getStripeWithdrawUrl,
} from "@payforlink/lib/stripe-connect";

type ActionResult = { error: string };

export async function initiateStripeConnect(): Promise<ActionResult | never> {
  try {
    const url = await getStripeConnectAccountLinkUrl();
    redirect(url);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to connect Stripe" };
  }
}

export async function requestWithdraw(): Promise<ActionResult | never> {
  try {
    const url = await getStripeWithdrawUrl();
    if (url) redirect(url);
    redirect("/studio");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to start withdraw" };
  }
}
