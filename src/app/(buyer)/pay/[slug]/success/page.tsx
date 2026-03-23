import { createServiceClient } from "@payforlink/lib/supabase/server";
import { stripe } from "@payforlink/lib/stripe";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SuccessPageClient, SuccessPoller } from "./success-page-client";

export const metadata: Metadata = {
  robots: { index: false },
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { session_id } = await searchParams;

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
    (session as { customer_details?: { email?: string } }).customer_details?.email;

  if (!customerEmail) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Invalid session</h1>
        <p>No customer email found.</p>
      </main>
    );
  }

  const supabase = createServiceClient();
  const { data: purchase } = await supabase
    .from("purchases")
    .select("id, buyer_email, buyer_email_verified")
    .eq("stripe_checkout_session_id", session.id)
    .single();

  if (!purchase) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Payment received</h1>
        <SuccessPoller />
      </main>
    );
  }

  if (purchase.buyer_email_verified) {
    redirect(`/orders/${purchase.id}`);
    return (
      <main style={{ padding: "2rem", maxWidth: "28rem", margin: "0 auto" }}>
        <h1>You&apos;re all set</h1>
        <p>Your purchase was already verified. Check your email for access.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "28rem", margin: "0 auto" }}>
      <h1>Verify your email</h1>
      <p>
        Enter the 6-digit code we sent to <strong>{customerEmail}</strong>
      </p>
      <SuccessPageClient purchaseId={purchase.id} />
    </main>
  );
}
