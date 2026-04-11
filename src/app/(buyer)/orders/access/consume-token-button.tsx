"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConsumeTokenButton({
  rawToken,
  orderId,
}: {
  rawToken: string;
  orderId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/consume-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: rawToken, oid: orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      // Remember this order so the navbar can show a personalised link
      localStorage.setItem("last_order_id", orderId);
      // Redirect to delivery URL via the access route
      router.push(`/api/orders/${orderId}/access`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-full font-medium text-base hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="animate-spin size-4 shrink-0" />}
        {loading ? "Opening…" : "Unseal my purchase →"}
      </button>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
