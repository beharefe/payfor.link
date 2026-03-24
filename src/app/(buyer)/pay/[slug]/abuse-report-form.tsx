"use client";

import { useActionState, useState } from "react";

type State = { ok: true } | { error: string } | null;

export function AbuseReportForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);

  async function submit(_prev: State, formData: FormData): Promise<State> {
    const res = await fetch("/api/report-abuse", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        reason: formData.get("reason"),
        description: formData.get("description"),
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? "Failed to submit. Try again." };
    }
    return { ok: true };
  }

  const [state, formAction] = useActionState(submit, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: "none",
          color: "#AAAAAA",
          fontSize: "12px",
          cursor: "pointer",
          padding: 0,
        }}
      >
        Report this link
      </button>
    );
  }

  if (state && "ok" in state) {
    return (
      <p style={{ color: "#6B6B6B", fontSize: "13px" }}>
        Report submitted. Thank you.
      </p>
    );
  }

  return (
    <form action={formAction} style={{ textAlign: "left", fontSize: "14px" }}>
      <p style={{ margin: "0 0 0.5rem", fontWeight: 500 }}>Report this link</p>
      <select
        name="reason"
        required
        style={{
          display: "block",
          width: "100%",
          padding: "8px",
          marginBottom: "8px",
          border: "1px solid #E5E5E5",
          borderRadius: "8px",
        }}
      >
        <option value="">Select a reason</option>
        <option value="scam">Scam or fraud</option>
        <option value="malware">Malware or phishing</option>
        <option value="copyright">Copyright violation</option>
        <option value="other">Other</option>
      </select>
      <textarea
        name="description"
        placeholder="Optional details"
        maxLength={500}
        rows={3}
        style={{
          display: "block",
          width: "100%",
          padding: "8px",
          marginBottom: "8px",
          border: "1px solid #E5E5E5",
          borderRadius: "8px",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      {state && "error" in state && (
        <p style={{ color: "#C0392B", margin: "0 0 8px", fontSize: "13px" }}>
          {state.error}
        </p>
      )}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "100px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Submit report
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "1px solid #E5E5E5",
            borderRadius: "100px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
