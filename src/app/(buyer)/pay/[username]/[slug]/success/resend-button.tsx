"use client";

import { useState } from "react";

export function ResendAccessButton({
  email,
  orderId,
}: {
  email: string;
  orderId: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleResend() {
    setState("loading");
    try {
      const res = await fetch("/api/orders/send-access-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, oid: orderId }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="text-sm text-center text-muted-foreground">
        ✓ Link resent to <span className="font-medium text-foreground">{email}</span>
      </p>
    );
  }

  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-2">
        Didn&apos;t receive the email?
      </p>
      <button
        type="button"
        onClick={handleResend}
        disabled={state === "loading"}
        className="text-sm font-medium text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity disabled:opacity-50 bg-transparent border-none cursor-pointer p-0"
      >
        {state === "loading" ? "Sending…" : "Resend access link"}
      </button>
      {state === "error" && (
        <p className="text-xs text-destructive mt-1">Failed to send. Try again.</p>
      )}
    </div>
  );
}
