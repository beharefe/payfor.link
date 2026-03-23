"use server";

import { redirect } from "next/navigation";
import {
  getStripeConnectAccountLinkUrl,
  getStripeWithdrawUrl,
} from "@unseallink/lib/stripe-connect";

export async function initiateStripeConnect(_formData?: FormData): Promise<void> {
  let url: string;
  try {
    url = await getStripeConnectAccountLinkUrl();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to connect Stripe";
    redirect(`/dashboard?error=${encodeURIComponent(msg)}`);
  }
  redirect(url);
}

export async function requestWithdraw(_formData?: FormData): Promise<void> {
  let url: string | null;
  try {
    url = await getStripeWithdrawUrl();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to start withdraw";
    redirect(`/dashboard?error=${encodeURIComponent(msg)}`);
  }
  redirect(url ?? "/dashboard");
}
