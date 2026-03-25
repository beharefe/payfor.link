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
      <main style={{ padding: "2rem", textAlign: "center" }}>
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
      <main style={{ padding: "2rem", textAlign: "center" }}>
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
      <main style={{ padding: "2rem", textAlign: "center" }}>
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
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Payment received</h1>
        <SuccessPoller />
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "28rem",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>✅</p>
      <h1
        style={{ fontSize: "1.4rem", fontWeight: 500, margin: "0 0 0.25rem" }}
      >
        Payment confirmed
      </h1>
      <p style={{ fontWeight: 500, margin: "0 0 0.25rem" }}>
        {order.product_title}
      </p>
      <p style={{ color: "#6B6B6B", margin: "0 0 1.5rem" }}>
        ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()}
      </p>
      <p style={{ margin: "0 0 0.5rem" }}>
        Your access link has been sent to <strong>{customerEmail}</strong>
      </p>
      <p style={{ color: "#6B6B6B", fontSize: "0.9rem", margin: 0 }}>
        Check your inbox and click the link to access your purchase.
      </p>
    </main>
  );
}
