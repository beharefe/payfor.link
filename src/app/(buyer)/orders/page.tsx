import { createClient, createServiceClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TABLES } from "@unseallink/lib/db";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const service = createServiceClient();
  const { data: orders } = await service
    .from(TABLES.ORDERS)
    .select("id, product_title, price_paid, currency, created_at, status")
    .eq("buyer_email", user.email ?? "")
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto" }}>
      <h1>Your orders</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>Signed in as {user.email}</p>

      {!orders?.length ? (
        <p>No orders yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {orders.map((order) => (
            <li
              key={order.id}
              style={{ padding: "1rem", border: "1px solid #eee", borderRadius: "8px", marginBottom: "0.5rem" }}
            >
              <strong>{order.product_title}</strong>
              <br />
              <span style={{ color: "#666", fontSize: "0.9rem" }}>
                ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()} &middot;{" "}
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <br />
              <Link
                href={`/orders/${order.id}`}
                style={{ marginTop: "0.5rem", display: "inline-block", fontWeight: 500 }}
              >
                View order →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
