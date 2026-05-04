"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type FlowState =
  | { type: "idle" }
  | { type: "attaching" }
  | { type: "waiting"; code: string; expiresAt: number }
  | { type: "complete"; orderId: string }
  | { type: "expired" }
  | { type: "error"; message: string };

const ACP_LOGO = (
  <svg
    viewBox="0 0 393 393"
    className="h-4 w-4 shrink-0 rounded-sm"
    aria-hidden="true"
  >
    <rect y="0.828369" width="392.172" height="392.172" rx="13" fill="black" />
    <path
      d="M311.11 91.9139C300.77 88.6194 289.923 86.9808 278.56 86.9808C264.219 86.9808 250.568 89.7595 237.625 95.3334C224.681 100.899 213.269 108.91 203.395 119.368C199.51 123.527 195.983 127.937 192.831 132.604L218.384 183.468C219.591 185.872 223.167 185.373 223.658 182.727C225.921 170.565 230.896 160.141 238.598 151.455C249.496 139.159 263.512 133.011 280.648 133.011C290.522 133.011 299.946 135.282 308.938 139.833C317.922 144.384 326.798 151.355 335.549 160.739L340.715 106.864C331.307 100.183 321.433 95.2002 311.101 91.9057L311.11 91.9139Z"
      fill="#DEFF00"
    />
    <path
      d="M70.8497 260.305H117.291L112.026 273.999L98.891 304.639H50.2783L70.8497 260.305Z"
      fill="#DEFF00"
    />
    <path
      d="M341.414 244.64L339.001 288.524C338.852 291.245 337.396 293.732 335.1 295.205C327.447 300.105 319.195 303.932 310.336 306.677C300.046 309.872 289.357 311.469 278.277 311.469C266.357 311.469 254.919 309.53 243.98 305.662C233.033 301.794 224.74 295.879 215.523 288.325C202.48 277.676 193.114 265.313 186.176 249.964C184.371 245.971 182.798 241.878 181.459 237.693L152.952 171.779L132.314 222.236H88.5095L153.926 81.2738C153.926 81.2738 230.33 234.441 232.576 237.943C234.314 240.647 236.269 243.201 238.449 245.613C249.254 257.568 263.32 263.55 280.639 263.55C290.888 263.55 301.103 261.329 311.301 256.869C319.512 253.284 327.705 248.259 335.89 241.787C338.195 239.965 341.563 241.712 341.397 244.64H341.414Z"
      fill="#DEFF00"
    />
  </svg>
);

function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemaining(secs);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining === 0) return null;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return (
    <span className="font-mono text-xs tabular-nums text-muted-foreground">
      {mins}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export function ActionCodeCTA({ linkId }: { linkId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FlowState>({ type: "idle" });
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPoller() {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  }

  function close() {
    stopPoller();
    setOpen(false);
    setState({ type: "idle" });
    setCode("");
    setEmail("");
  }

  function startPolling(pollCode: string) {
    const pollUrl = `/api/action-code-status?code=${encodeURIComponent(pollCode)}&linkId=${encodeURIComponent(linkId)}&email=${encodeURIComponent(email)}`;
    pollerRef.current = setInterval(async () => {
      try {
        const res = await fetch(pollUrl);
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: "waiting" | "complete" | "expired" | "error";
          orderId?: string;
          message?: string;
        };
        if (data.status === "complete" && data.orderId) {
          stopPoller();
          setState({ type: "complete", orderId: data.orderId });
        } else if (data.status === "expired") {
          stopPoller();
          setState({ type: "expired" });
        } else if (data.status === "error") {
          stopPoller();
          setState({ type: "error", message: data.message ?? "Unknown error" });
        }
      } catch {
        // network error — keep polling
      }
    }, 2500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !email.trim()) return;

    const trimmedCode = code.replace(/\s/g, "");
    setState({ type: "attaching" });

    try {
      const res = await fetch("/api/action-code-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId, email: email.trim(), code: trimmedCode }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setState({ type: "error", message: data.error ?? "Checkout failed" });
        return;
      }

      // Code expires ~2 minutes from now (Action Codes TTL)
      const expiresAt = Date.now() + 2 * 60 * 1000;
      setState({ type: "waiting", code: trimmedCode, expiresAt });
      startPolling(trimmedCode);
    } catch {
      setState({ type: "error", message: "Network error. Please try again." });
    }
  }

  // Redirect when order is complete
  useEffect(() => {
    if (state.type === "complete") {
      const timer = setTimeout(() => {
        window.location.href = `/orders/${state.orderId}`;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Cleanup on unmount
  useEffect(() => () => stopPoller(), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-border rounded-full text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        {ACP_LOGO}
        Use Action Code
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Modal */}
          <div className="relative w-full sm:max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 space-y-5 shadow-2xl mx-0 sm:mx-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {ACP_LOGO}
                <p className="text-sm font-medium text-foreground">
                  Pay with Action Code
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {state.type === "idle" && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate an 8-digit code at{" "}
                  <a
                    href="https://actioncode.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline underline-offset-2"
                  >
                    actioncode.app
                  </a>
                  {" "}in your Solana wallet, then paste it below.
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="block w-full px-3 py-2.5 border border-input rounded-xl text-sm bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{8}"
                  maxLength={8}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  required
                  placeholder="12345678"
                  className="block w-full px-3 py-2.5 border border-input rounded-xl text-sm bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none font-mono tracking-widest text-center"
                />
                <button
                  type="submit"
                  disabled={code.length !== 8 || !email}
                  className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </form>
            )}

            {state.type === "attaching" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="animate-spin size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Preparing transaction…
                </p>
              </div>
            )}

            {state.type === "waiting" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-2">
                  <Loader2 className="animate-spin size-6 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground text-center">
                    Open your wallet and approve
                  </p>
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    The transaction has been sent to your Solana wallet. Approve
                    it to complete your purchase.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Code expires in
                  </span>
                  <CountdownTimer expiresAt={state.expiresAt} />
                </div>
              </div>
            )}

            {state.type === "complete" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg
                    className="size-5 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Payment confirmed!
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecting to your order…
                </p>
              </div>
            )}

            {state.type === "expired" && (
              <div className="space-y-3">
                <p className="text-sm text-foreground font-medium">
                  Code expired
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Action codes expire after 2 minutes. Generate a new one at{" "}
                  <a
                    href="https://actioncode.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline underline-offset-2"
                  >
                    actioncode.app
                  </a>{" "}
                  and try again.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCode("");
                    setState({ type: "idle" });
                  }}
                  className="w-full py-2.5 border border-border rounded-full text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {state.type === "error" && (
              <div className="space-y-3">
                <p className="text-sm text-destructive">{state.message}</p>
                <button
                  type="button"
                  onClick={() => setState({ type: "idle" })}
                  className="w-full py-2.5 border border-border rounded-full text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
