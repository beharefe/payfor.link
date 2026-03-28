"use client";

import { Input } from "@unseallink/components/ui/input";
import { Loader2 } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        className="h-11 rounded-xl text-base"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground border-none rounded-full font-medium text-base cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="size-4 animate-spin shrink-0" />}
        {loading ? "Sending…" : "Send sign-in link"}
      </button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </form>
  );
}
