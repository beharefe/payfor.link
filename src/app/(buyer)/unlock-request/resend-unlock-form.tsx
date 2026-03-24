"use client";

import { useState } from "react";

export function ResendUnlockForm() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (
      form.elements.namedItem("email") as HTMLInputElement
    )?.value?.trim();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/resend-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setStatus("success");
        setMessage("Check your inbox for your access link(s).");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Request failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={status === "loading"}
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.25rem",
          }}
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        style={{ marginTop: "0.75rem", padding: "0.5rem 1rem" }}
      >
        {status === "loading" ? "Sending…" : "Send access link"}
      </button>
      {message && (
        <p
          style={{
            marginTop: "0.75rem",
            color: status === "error" ? "red" : "green",
          }}
        >
          {message}
        </p>
      )}
    </form>
  );
}
