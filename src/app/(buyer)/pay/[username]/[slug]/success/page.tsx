import { TABLES } from "@unseallink/lib/db";
import { stripe } from "@unseallink/lib/stripe";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SuccessPoller } from "./success-page-client";
import { ResendAccessButton } from "./resend-button";
import { DisputeForm } from "./dispute-form";

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

  void username;
  void slug;

  if (!session_id) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
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
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground mb-2">Invalid session</h1>
          <p className="text-muted-foreground text-sm">Could not load session.</p>
        </div>
      </main>
    );
  }

  const customerEmail =
    session.customer_email ??
    (session as { customer_details?: { email?: string } }).customer_details?.email;

  if (!customerEmail) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
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
    .select("id, product_title, price_paid, currency, created_at, seller_id, product_version, stripe_payment_id")
    .eq("stripe_checkout_session_id", session.id)
    .single();

  if (!order) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-3xl mb-3">⏳</p>
          <h1 className="text-xl font-medium text-foreground mb-2">Payment received</h1>
          <SuccessPoller />
        </div>
      </main>
    );
  }

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name")
    .eq("id", order.seller_id)
    .single();

  const shortId = order.id.slice(0, 8).toUpperCase();
  const purchasedOn = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-sm flex flex-col gap-5">

          {/* Success header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center justify-center size-12 rounded-full bg-green-100 dark:bg-green-950 mb-1">
            <CheckCircle className="size-6 text-green-600 dark:text-green-400" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            Payment confirmed
          </h1>
          <p className="text-muted-foreground text-sm">
            Your access link is on its way to{" "}
            <span className="font-medium text-foreground">{customerEmail}</span>
          </p>
        </div>

        {/* Receipt card */}
        <div className="border border-border rounded-2xl bg-card overflow-hidden">
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Receipt
            </p>
            <p className="font-medium text-foreground leading-snug mb-0.5">
              {order.product_title}
            </p>
            {seller?.name && (
              <p className="text-sm text-muted-foreground mb-4">by {seller.name}</p>
            )}
            <div className="border-t border-border pt-4 flex flex-col gap-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="font-medium text-foreground">
                  ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{purchasedOn}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order</span>
                <span className="text-foreground font-mono text-xs">#{shortId}</span>
              </div>
            </div>
          </div>
          <div className="bg-muted/40 border-t border-border px-5 py-3.5">
            <p className="text-xs text-muted-foreground text-center">
              Check your inbox and click the link to access your purchase
            </p>
          </div>
        </div>

        {/* Resend */}
        <ResendAccessButton email={customerEmail} orderId={order.id} />

        {/* Dispute form */}
        <DisputeForm
          buyerEmail={customerEmail}
          productName={order.product_title}
          sellerUsername={seller?.name ?? "unknown"}
          amountPaid={order.price_paid}
          currency={order.currency}
          paymentIntentId={order.stripe_payment_id ?? session.id}
          orderId={order.id}
        />

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="font-medium text-foreground hover:underline">
            unseal.link
          </Link>
        </p>

      </div>
    </main>
  );
}
