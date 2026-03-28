"use server";

import {
  getStripeConnectAccountLinkUrl,
  getStripeWithdrawUrl,
} from "@unseallink/lib/stripe-connect";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getAppUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function initiateStripeConnect(
  _formData?: FormData,
): Promise<void> {
  let url: string | undefined;
  let errorMsg: string | undefined;
  try {
    const appUrl = await getAppUrl();
    url = await getStripeConnectAccountLinkUrl(appUrl);
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
    const appUrl = await getAppUrl();
    url = await getStripeWithdrawUrl(appUrl);
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Failed to start withdraw";
  }
  if (errorMsg) {
    redirect(`/dashboard?error=${encodeURIComponent(errorMsg)}`);
  }
  redirect(url ?? "/dashboard");
}
