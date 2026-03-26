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
        className="bg-transparent border-none text-[#AAAAAA] text-xs cursor-pointer p-0"
      >
        Report this link
      </button>
    );
  }

  if (state && "ok" in state) {
    return (
      <p className="text-muted-foreground text-[13px]">
        Report submitted. Thank you.
      </p>
    );
  }

  return (
    <form action={formAction} className="text-left text-[14px]">
      <p className="mb-2 font-medium">Report this link</p>
      <select
        name="reason"
        required
        className="block w-full px-2 py-2 mb-2 border border-border rounded-lg bg-background text-foreground"
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
        className="block w-full px-2 py-2 mb-2 border border-border rounded-lg resize-y bg-background text-foreground box-border"
      />
      {state && "error" in state && (
        <p className="text-destructive mb-2 text-[13px]">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground border-none rounded-full cursor-pointer text-[13px] hover:opacity-90 transition-opacity"
        >
          Submit report
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 bg-transparent border border-border rounded-full cursor-pointer text-[13px]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
