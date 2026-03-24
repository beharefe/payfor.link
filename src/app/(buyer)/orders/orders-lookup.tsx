"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Order = {
  id: string;
  product_title: string;
  price_paid: number;
  currency: string;
  created_at: string;
  status: string;
};

type Step = "email" | "code" | "orders";

export function OrdersLookup({ verifiedEmail }: { verifiedEmail: string | null }) {
  const [step, setStep] = useState<Step>(verifiedEmail ? "orders" : "email");
  const [email, setEmail] = useState(verifiedEmail ?? "");
  const [code, setCode] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load orders when session is already valid (e.g. right after purchase OTP)
  useEffect(() => {
    if (verifiedEmail && step === "orders" && orders === null) {
      setLoading(true);
      fetch(`/api/orders/lookup?email=${encodeURIComponent(verifiedEmail)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) setError(data.error);
          else setOrders(data.orders ?? []);
        })
        .catch(() => setError("Failed to load orders."))
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setStep("code");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      // Now fetch orders
      const ordersRes = await fetch(
        `/api/orders/lookup?email=${encodeURIComponent(email.trim())}`,
      );
      const ordersData = await ordersRes.json();
      if (!ordersRes.ok) {
        setError(ordersData.error ?? "Failed to load orders.");
      } else {
        setOrders(ordersData.orders ?? []);
        setStep("orders");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <div>
        <form
          onSubmit={handleSendCode}
          style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}
        >
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
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
        {error && (
          <p style={{ color: "#C0392B", marginTop: "1rem", textAlign: "center" }}>{error}</p>
        )}
      </div>
    );
  }

  if (step === "code") {
    return (
      <div>
        <p style={{ color: "#6B6B6B", marginBottom: "1.5rem" }}>
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
        <form
          onSubmit={handleVerifyCode}
          style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            style={{
              padding: "0.625rem 1rem",
              fontSize: "1.25rem",
              letterSpacing: "0.4em",
              border: "1px solid #E5E5E5",
              borderRadius: "12px",
              width: "10rem",
              outline: "none",
              textAlign: "center",
              fontFamily: "monospace",
            }}
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              padding: "0.625rem 1.25rem",
              background: "#111111",
              color: "#ffffff",
              border: "none",
              borderRadius: "100px",
              fontWeight: 500,
              fontSize: "1rem",
              cursor: loading || code.length !== 6 ? "not-allowed" : "pointer",
              opacity: loading || code.length !== 6 ? 0.6 : 1,
            }}
          >
            {loading ? "Verifying…" : "View orders"}
          </button>
        </form>
        {error && (
          <p style={{ color: "#C0392B", marginTop: "1rem", textAlign: "center" }}>{error}</p>
        )}
        <button
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
          style={{
            marginTop: "1rem",
            background: "none",
            border: "none",
            color: "#6B6B6B",
            fontSize: "0.875rem",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  // orders step
  return (
    <div style={{ marginTop: "1rem" }}>
      {orders!.length === 0 ? (
        <p style={{ color: "#6B6B6B", textAlign: "center" }}>No orders found for that email.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 auto", maxWidth: "28rem" }}>
          {orders!.map((order) => (
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
                  ${order.price_paid.toFixed(2)} ·{" "}
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
  );
}
