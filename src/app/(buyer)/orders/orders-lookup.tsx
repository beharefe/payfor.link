"use client";

import { useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  product_title: string;
  price_paid: number;
  currency: string;
  created_at: string;
  status: string;
};

export function OrdersLookup() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOrders(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/lookup?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setOrders(data.orders ?? []);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{
            padding: "0.625rem 1rem",
            fontSize: "1rem",
            border: "1px solid #E5E5E5",
            borderRadius: "12px",
            width: "16rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.625rem 1.25rem",
            background: "#111111",
            color: "#ffffff",
            border: "none",
            borderRadius: "100px",
            fontWeight: 500,
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Looking up…" : "Find my orders"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#C0392B", marginTop: "1rem", textAlign: "center" }}>{error}</p>
      )}

      {orders !== null && (
        <div style={{ marginTop: "2rem" }}>
          {orders.length === 0 ? (
            <p style={{ color: "#6B6B6B", textAlign: "center" }}>No orders found for that email.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: "0 auto", maxWidth: "28rem" }}>
              {orders.map((order) => (
                <li
                  key={order.id}
                  style={{
                    border: "1px solid #E5E5E5",
                    borderRadius: "16px",
                    padding: "1rem 1.25rem",
                    marginBottom: "0.75rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>{order.product_title}</p>
                    <p style={{ margin: "0.2rem 0 0", color: "#6B6B6B", fontSize: "0.85rem" }}>
                      ${order.price_paid.toFixed(2)} · {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    style={{
                      padding: "0.4rem 0.9rem",
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
        </div>
      )}
    </div>
  );
}
