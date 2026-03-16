"use client";

import { sendLibraryOtp, verifyLibraryOtp } from "@payforlink/app/actions/library";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";

export function LibraryForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const [sendError, sendAction] = useActionState(async (_prev: string | null, formData: FormData) => {
    const result = await sendLibraryOtp(formData);
    if ("error" in result) return result.error;
    setEmail(formData.get("email")?.toString()?.trim() ?? "");
    setSent(true);
    return null;
  }, null);

  const [verifyError, verifyAction] = useActionState(async (_prev: string | null, formData: FormData) => {
    const result = await verifyLibraryOtp(formData);
    if ("error" in result) return result.error;
    router.refresh();
    return null;
  }, null);

  if (!sent) {
    return (
      <form action={sendAction} style={{ marginTop: "1rem" }}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
          />
        </div>
        <button type="submit" style={{ marginTop: "0.75rem", padding: "0.5rem 1rem" }}>
          Send code
        </button>
        {sendError && <p style={{ color: "red", marginTop: "0.5rem" }}>{sendError}</p>}
      </form>
    );
  }

  return (
    <form action={verifyAction} style={{ marginTop: "1rem" }}>
      <p>Enter the 6-digit code sent to <strong>{email}</strong></p>
      <input type="hidden" name="email" value={email} />
      <div style={{ marginTop: "0.75rem" }}>
        <label htmlFor="code">Code</label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          required
          style={{ display: "block", padding: "0.5rem", fontSize: "1.25rem", width: "8rem", marginTop: "0.25rem" }}
        />
      </div>
      <button type="submit" style={{ marginTop: "0.75rem", padding: "0.5rem 1rem" }}>
        Verify
      </button>
      {verifyError && <p style={{ color: "red", marginTop: "0.5rem" }}>{verifyError}</p>}
      <p style={{ marginTop: "0.75rem" }}>
        <button type="button" onClick={() => setSent(false)} style={{ padding: 0, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Use a different email
        </button>
      </p>
    </form>
  );
}
