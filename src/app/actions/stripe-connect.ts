"use server";

import {
  getStripeConnectAccountLinkUrl,
  getStripeWithdrawUrl,
} from "@unseallink/lib/stripe-connect";
import { redirect } from "next/navigation";

export async function initiateStripeConnect(
  _formData?: FormData,
): Promise<void> {
  let url: string | undefined;
  let errorMsg: string | undefined;
  try {
    url = await getStripeConnectAccountLinkUrl();
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Failed to connect Stripe";
  }
  if (errorMsg || !url) {
    redirect(
      `/dashboard?error=${encodeURIComponent(errorMsg ?? "Failed to connect Stripe")}`,
    );
  }
  redirect(url!);
}

export async function requestWithdraw(_formData?: FormData): Promise<void> {
  let url: string | null | undefined;
  let errorMsg: string | undefined;
  try {
    url = await getStripeWithdrawUrl();
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Failed to start withdraw";
  }
  if (errorMsg) {
    redirect(`/dashboard?error=${encodeURIComponent(errorMsg)}`);
  }
  redirect(url ?? "/dashboard");
}
