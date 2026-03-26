import { TABLES } from "@unseallink/lib/db";
import { stripe } from "@unseallink/lib/stripe";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import { SuccessPoller } from "./success-page-client";

export const metadata: Metadata = {
  robots: { index: false },
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { session_id } = await searchParams;

  // suppress unused warning — slug is part of route, not used in this handler
  void slug;

  if (!session_id) {
    return (
      <main className="p-8 text-center">
        <h1>Invalid session</h1>
        <p>Missing session. Return to the paywall and try again.</p>
      </main>
    );
  }

  let session: { customer_email?: string | null; id: string };
  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["customer_details"],
    });
  } catch {
    return (
      <main className="p-8 text-center">
        <h1>Invalid session</h1>
        <p>Could not load session.</p>
      </main>
    );
  }

  const customerEmail =
    session.customer_email ??
    (session as { customer_details?: { email?: string } }).customer_details
      ?.email;

  if (!customerEmail) {
    return (
      <main className="p-8 text-center">
        <h1>Invalid session</h1>
        <p>No customer email found.</p>
      </main>
    );
  }

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from(TABLES.ORDERS)
    .select("id, product_title, price_paid, currency")
    .eq("stripe_checkout_session_id", session.id)
    .single();

  if (!order) {
    return (
      <main className="p-8 text-center">
        <h1>Payment received</h1>
        <SuccessPoller />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-[28rem] mx-auto text-center">
      <p className="text-3xl mb-2">✅</p>
      <h1 className="text-2xl font-medium mb-1">
        Payment confirmed
      </h1>
      <p className="font-medium mb-1">
        {order.product_title}
      </p>
      <p className="text-muted-foreground mb-6">
        ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()}
      </p>
      <p className="mb-2">
        Your access link has been sent to <strong>{customerEmail}</strong>
      </p>
      <p className="text-muted-foreground text-sm m-0">
        Check your inbox and click the link to access your purchase.
      </p>
    </main>
  );
}
