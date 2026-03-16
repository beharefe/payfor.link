"use client";

import { sendLibraryMagicLink } from "@payforlink/app/actions/library";
import { useActionState } from "react";

async function submitEmail(_prev: string | null, formData: FormData): Promise<string | null> {
  const result = await sendLibraryMagicLink(formData);
  if ("error" in result) return result.error;
  return "Check your email for the sign-in link.";
}

export function LibraryForm() {
  const [message, formAction] = useActionState(submitEmail, null);

  return (
    <form action={formAction} style={{ marginTop: "1rem" }}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.25rem",
          }}
        />
      </div>
      <button type="submit" style={{ marginTop: "0.75rem", padding: "0.5rem 1rem" }}>
        Send sign-in link
      </button>
      {message && (
        <p style={{ marginTop: "0.75rem", color: message.startsWith("Check") ? "green" : "red" }}>
          {message}
        </p>
      )}
    </form>
  );
}
