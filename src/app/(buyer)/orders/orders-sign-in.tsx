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
      <div className="text-center">
        <p className="text-3xl mb-2">✉️</p>
        <p className="font-medium mb-2">Check your inbox</p>
        <p className="text-muted-foreground text-sm">
          If there are orders for <strong>{email}</strong>, we sent you a sign-in link.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
    >
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2.5 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={loading}
        className={`px-5 py-2.5 bg-primary text-primary-foreground border-none rounded-full font-medium text-base ${loading ? "cursor-wait" : "cursor-pointer"} hover:opacity-90 transition-opacity`}
      >
        {loading ? "Sending…" : "Send sign-in link"}
      </button>
      {error && (
        <p className="text-destructive text-sm m-0">{error}</p>
      )}
    </form>
  );
}
