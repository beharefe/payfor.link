import { TABLES } from "@unseallink/lib/db";
import { stripe } from "@unseallink/lib/stripe";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import { SuccessPoller } from "./success-page-client";

export const metadata: Metadata = {
  robots: { index: false },
};

type Props = {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: Props) {
  const { username, slug } = await params;
  const { session_id } = await searchParams;

  // suppress unused warning — params are part of route, not used directly here
  void username;
  void slug;

  if (!session_id) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground mb-2">Invalid session</h1>
          <p className="text-muted-foreground text-sm">Missing session. Return to the paywall and try again.</p>
        </div>
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
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground mb-2">Invalid session</h1>
          <p className="text-muted-foreground text-sm">Could not load session.</p>
        </div>
      </main>
    );
  }

  const customerEmail =
    session.customer_email ??
    (session as { customer_details?: { email?: string } }).customer_details
      ?.email;

  if (!customerEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground mb-2">Invalid session</h1>
          <p className="text-muted-foreground text-sm">No customer email found.</p>
        </div>
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
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-3xl mb-3">⏳</p>
          <h1 className="text-xl font-medium text-foreground mb-2">Payment received</h1>
          <SuccessPoller />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-4xl mb-4">✓</p>
        <h1 className="text-2xl font-medium tracking-tight text-foreground mb-1">
          Payment confirmed
        </h1>
        <p className="font-medium text-foreground mb-1">
          {order.product_title}
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()}
        </p>
        <div className="border border-border rounded-2xl bg-card p-5 text-left">
          <p className="text-sm text-foreground mb-1">
            Access link sent to <span className="font-medium">{customerEmail}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Check your inbox and click the link to access your purchase.
          </p>
        </div>
      </div>
    </main>
  );
}
