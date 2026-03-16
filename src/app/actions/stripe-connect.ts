"use server";

import { redirect } from "next/navigation";
import {
  getStripeConnectAccountLinkUrl,
  getStripeWithdrawUrl,
} from "@payforlink/lib/stripe-connect";

type ActionResult = { error: string };

export async function initiateStripeConnect(_formData?: FormData): Promise<ActionResult | never> {
  let url: string;
  try {
    url = await getStripeConnectAccountLinkUrl();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to connect Stripe" };
  }
  redirect(url);
}

export async function requestWithdraw(_formData?: FormData): Promise<ActionResult | never> {
  let url: string | null;
  try {
    url = await getStripeWithdrawUrl();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to start withdraw" };
  }
  redirect(url ?? "/studio");
}
