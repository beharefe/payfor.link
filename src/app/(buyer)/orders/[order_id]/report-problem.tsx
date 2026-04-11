"use client";

import { useState } from "react";

const REASONS = [
  { label: "Didn't receive what I paid for", value: "other" },
  { label: "Content isn't what was described", value: "other" },
  { label: "I think this is a scam", value: "scam" },
  { label: "Malware or harmful content", value: "malware" },
  { label: "Copyright infringement", value: "copyright" },
] as const;

interface Props {
  productId: string;
  orderId: string;
  reporterEmail: string;
}

export function ReportProblem({ productId, orderId, reporterEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0].value);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (submitted) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        Report received. We&apos;ll review it within 48 hours.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground underline underline-offset-2 bg-transparent border-none cursor-pointer p-0 hover:text-foreground transition-colors"
      >
        Report a problem
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/report-abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          reason,
          description: message
            ? `[Order: ${orderId.slice(0, 8).toUpperCase()}] ${message}`
            : `[Order: ${orderId.slice(0, 8).toUpperCase()}]`,
          reporter_email: reporterEmail,
        }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full px-4 py-2.5 border border-input rounded-xl text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {REASONS.map((r) => (
          <option key={r.label} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Additional details (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
        rows={3}
        className="w-full px-4 py-2.5 border border-input rounded-xl text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground border-none rounded-full text-sm font-medium cursor-pointer disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 border border-input rounded-full text-sm bg-background text-foreground cursor-pointer hover:opacity-80 transition-opacity"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
