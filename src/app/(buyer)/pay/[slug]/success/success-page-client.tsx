"use client";

import { verifyOtp, resendOtp } from "@unseallink/app/actions/otp";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SuccessPoller() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(id);
  }, [router]);
  return (
    <p style={{ color: "#666", marginTop: "1rem" }}>
      Confirming your payment, please wait…
    </p>
  );
}

export function SuccessPageClient({ purchaseId }: { purchaseId: string }) {
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function handleVerify(_prev: string | null, formData: FormData): Promise<string | null> {
    const code = formData.get("code")?.toString()?.trim() ?? "";
    if (!code) return "Enter the 6-digit code.";
    const result = await verifyOtp(purchaseId, code);
    if ("error" in result) return result.error;
    return null;
  }

  async function handleResend() {
    setResendMessage(null);
    const result = await resendOtp(purchaseId);
    if ("error" in result) {
      setResendMessage(result.error);
    } else {
      setResendMessage("Code sent. Check your email.");
    }
  }

  const [error, formAction] = useActionState(handleVerify, null);

  return (
    <>
      <form action={formAction} style={{ marginTop: "1rem" }}>
        <input
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          style={{ padding: "0.5rem", width: "8rem", fontSize: "1.25rem" }}
        />
        <button type="submit" style={{ marginLeft: "0.5rem", padding: "0.5rem 1rem" }}>
          Verify
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
      <p style={{ marginTop: "1rem" }}>
        <button type="button" onClick={handleResend} style={{ padding: "0.25rem 0.5rem" }}>
          Resend code
        </button>
      </p>
      {resendMessage && <p style={{ marginTop: "0.5rem" }}>{resendMessage}</p>}
    </>
  );
}
