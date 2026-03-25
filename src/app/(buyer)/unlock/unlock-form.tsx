"use client";

import { useEffect, useRef } from "react";

export function UnlockForm({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-submit after 1.5s — real browsers execute JS so the click is seamless.
  // Email scanner bots don't run JS, so the token is never pre-consumed.
  useEffect(() => {
    const id = setTimeout(() => formRef.current?.requestSubmit(), 1500);
    return () => clearTimeout(id);
  }, []);

  return (
    <form ref={formRef} action={action} style={{ width: "100%" }}>
      <button
        type="submit"
        style={{
          width: "100%",
          padding: "14px 28px",
          background: "#111111",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "100px",
          fontSize: "1rem",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {label} →
      </button>
    </form>
  );
}
