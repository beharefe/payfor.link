"use client";

import { useState } from "react";

const ISSUE_OPTIONS = [
  "I never received the email",
  "The link in my email doesn't work",
  "I was charged but payment shows as failed",
  "The content isn't what was described",
  "Other",
] as const;

interface Props {
  buyerEmail: string;
  productName: string;
  sellerUsername: string;
  amountPaid: number;
  currency: string;
  paymentIntentId: string;
  orderId: string;
}

export function DisputeForm({
  buyerEmail,
  productName,
  sellerUsername,
  amountPaid,
  currency,
  paymentIntentId,
  orderId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<string>(ISSUE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="border border-border rounded-2xl bg-card p-5 text-center">
        <p className="text-sm font-medium text-foreground mb-1">Report received</p>
        <p className="text-xs text-muted-foreground">
          We&apos;ll respond within 24 hours to{" "}
          <span className="font-medium text-foreground">{buyerEmail}</span>.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 underline underline-offset-2"
        >
          Didn&apos;t receive your access link?
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/buyer-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_email: buyerEmail,
          issue_type: issueType,
          product_name: productName,
          seller_username: sellerUsername,
          amount_paid: amountPaid,
          currency,
          payment_intent_id: paymentIntentId,
          order_id: orderId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to submit. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden">
      <div className="p-5">
        <p className="text-sm font-medium text-foreground mb-1">
          Didn&apos;t receive your access link?
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Check your spam folder first. Emails sometimes land there.
          Still nothing after 5 minutes?
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={buyerEmail}
            readOnly
            className="h-10 w-full rounded-xl border border-input bg-muted px-3 text-sm text-muted-foreground"
          />
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            {ISSUE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 h-10 border border-border rounded-full text-sm bg-background text-foreground hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
