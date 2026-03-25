import { verifySessionValue } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { OrdersSignIn } from "./orders-sign-in";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("buyer_session")?.value ?? "");

  if (!session) {
    return (
      <main
        style={{
          padding: "2rem",
          maxWidth: "24rem",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.5rem" }}>
          Your orders
        </h1>
        {error === "link_expired" && (
          <p style={{ color: "#C0392B", marginBottom: "1rem", fontSize: "0.9rem" }}>
            That link has expired. Enter your email to get a new one.
          </p>
        )}
        <p style={{ color: "#6B6B6B", marginBottom: "2rem" }}>
          Enter the email you used at checkout to access your orders.
        </p>
        <OrdersSignIn />
      </main>
    );
  }

  const service = createServiceClient();
  const { data: orders } = await service
    .from(TABLES.ORDERS)
    .select("id, product_title, price_paid, currency, created_at, status")
    .eq("buyer_email", session.email)
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "1.5rem" }}>
        Your orders
      </h1>

      {!orders?.length ? (
        <p style={{ color: "#6B6B6B" }}>No orders found for {session.email}.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {orders.map((order) => (
            <li
              key={order.id}
              style={{
                border: "1px solid #E5E5E5",
                borderRadius: "16px",
                padding: "1rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div>
                <p style={{ fontWeight: 500, margin: "0 0 0.25rem" }}>
                  {order.product_title}
                </p>
                <p style={{ color: "#6B6B6B", fontSize: "0.875rem", margin: 0 }}>
                  ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()} ·{" "}
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Link
                href={`/orders/${order.id}`}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#111111",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: "100px",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  whiteSpace: "nowrap",
                }}
              >
                View →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
