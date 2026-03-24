import { createServiceClient } from "@unseallink/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { TABLES } from "@unseallink/lib/db";
import { getVerifiedEmail } from "@unseallink/lib/buyer-session";
import { SuccessPageClient } from "@unseallink/app/(buyer)/pay/[slug]/success/success-page-client";

export const metadata: Metadata = {
  robots: { index: false },
};

type Props = { params: Promise<{ order_id: string }> };

export default async function OrderPage({ params }: Props) {
  const { order_id } = await params;

  const service = createServiceClient();
  const { data: order } = await service
    .from(TABLES.ORDERS)
    .select("id, buyer_email, buyer_email_verified, product_title, price_paid, currency, created_at, status, seller_id")
    .eq("id", order_id)
    .single();

  if (!order) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Order not found</h1>
        <p>
          <Link href="/orders">Back to your orders</Link>
        </p>
      </main>
    );
  }

  if (!order.buyer_email_verified) {
    return (
      <main style={{ padding: "2rem", maxWidth: "28rem", margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>✉️</p>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 500, margin: "0 0 0.5rem" }}>Verify your email</h1>
        <p style={{ color: "#6B6B6B", margin: "0 0 1.5rem" }}>
          Enter the 6-digit code sent to <strong>{order.buyer_email}</strong>
        </p>
        <SuccessPageClient orderId={order.id} />
        <p style={{ marginTop: "1.5rem" }}>
          <Link href="/orders" style={{ color: "#6B6B6B", fontSize: "0.9rem" }}>
            ← All orders
          </Link>
        </p>
      </main>
    );
  }

  // For verified orders, confirm the visitor owns this order via session cookie.
  const cookieStore = await cookies();
  const verifiedEmail = getVerifiedEmail(cookieStore.get("orders_session")?.value);
  if (!verifiedEmail || verifiedEmail !== order.buyer_email) {
    return (
      <main style={{ padding: "2rem", maxWidth: "28rem", margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🔒</p>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 500, margin: "0 0 0.5rem" }}>Session expired</h1>
        <p style={{ color: "#6B6B6B", margin: "0 0 1.5rem" }}>
          Please verify your email to view this order.
        </p>
        <Link
          href="/orders"
          style={{
            display: "inline-block",
            padding: "0.625rem 1.25rem",
            background: "#111111",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "100px",
            fontWeight: 500,
          }}
        >
          Verify email
        </Link>
      </main>
    );
  }

  if (order.status === "refunded") {
    return (
      <main style={{ padding: "2rem", maxWidth: "30rem", margin: "0 auto", textAlign: "center" }}>
        <h1>Order refunded</h1>
        <p>{order.product_title}</p>
        <p style={{ color: "#666" }}>This order was refunded and access is no longer available.</p>
        <p>
          <Link href="/orders">Back to your orders</Link>
        </p>
      </main>
    );
  }

  const { data: seller } = await service
    .from(TABLES.SELLERS)
    .select("name")
    .eq("id", order.seller_id)
    .single();

  const purchasedOn = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = order.id.slice(0, 8).toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <main style={{ padding: "2rem", maxWidth: "30rem", margin: "0 auto", textAlign: "center" }}>
      <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</p>
      <h1 style={{ marginBottom: "0.25rem" }}>Order confirmed</h1>
      <h2 style={{ fontWeight: "normal", fontSize: "1.1rem", marginBottom: "0.25rem" }}>
        {order.product_title}
      </h2>
      {seller?.name && (
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>by {seller.name}</p>
      )}

      <a
        href={`${appUrl}/api/orders/${order.id}/access`}
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "100px",
          fontWeight: 500,
          fontSize: "1rem",
          marginBottom: "1rem",
        }}
      >
        Access content →
      </a>

      <hr style={{ margin: "1.5rem 0", borderColor: "#eee" }} />

      <p style={{ color: "#999", fontSize: "0.85rem" }}>
        Purchased on {purchasedOn} &middot; Order #{shortId}
      </p>
      <p style={{ marginTop: "0.75rem" }}>
        <Link href="/orders" style={{ color: "#666", fontSize: "0.9rem" }}>
          ← All orders
        </Link>
      </p>
    </main>
  );
}
