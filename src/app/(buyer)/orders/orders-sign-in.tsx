"use client";

import { useState } from "react";

export function OrdersSignIn({ oid }: { oid?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/orders/send-access-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...(oid ? { oid } : {}) }),
      });
      // Always show success — don't reveal whether email exists
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>✉️</p>
        <p style={{ fontWeight: 500, margin: "0 0 0.5rem" }}>Check your inbox</p>
        <p style={{ color: "#6B6B6B", fontSize: "0.9rem" }}>
          If there are orders for <strong>{email}</strong>, we sent you a sign-in link.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: "0.625rem 1rem",
          border: "1px solid #E5E5E5",
          borderRadius: "12px",
          fontSize: "1rem",
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
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Sending…" : "Send sign-in link"}
      </button>
      {error && (
        <p style={{ color: "#C0392B", fontSize: "0.875rem", margin: 0 }}>{error}</p>
      )}
    </form>
  );
}
