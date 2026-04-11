"use client";

import { useState } from "react";

const MAX_ATTEMPTS = 3;

export function ResendAccessButton({
  email,
  orderId,
}: {
  email: string;
  orderId: string;
}) {
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function handleResend() {
    if (attempts >= MAX_ATTEMPTS || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders/send-access-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, oid: orderId }),
      });
      setAttempts((n) => n + 1);
      setState(res.ok ? "sent" : "error");
    } catch {
      setAttempts((n) => n + 1);
      setState("error");
    } finally {
      setLoading(false);
    }
  }

  if (attempts >= MAX_ATTEMPTS) {
    return (
      <p className="text-xs text-center text-muted-foreground">
        Check your spam folder or{" "}
        <a href="mailto:support@unseal.link" className="underline underline-offset-2">
          contact support
        </a>
        .
      </p>
    );
  }

  if (state === "sent") {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          ✓ Link resent to <span className="font-medium text-foreground">{email}</span>
        </p>
        {attempts < MAX_ATTEMPTS && (
          <button
            type="button"
            onClick={handleResend}
            disabled={state === "loading"}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:opacity-70 transition-opacity mt-1 bg-transparent border-none cursor-pointer p-0"
          >
            Resend again ({MAX_ATTEMPTS - attempts} left)
          </button>
        )}
      </div>
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
