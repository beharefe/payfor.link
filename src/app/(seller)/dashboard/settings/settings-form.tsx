"use client";

import { useActionState } from "react";
import { updateName } from "@unseallink/app/actions/settings";

export function SettingsForm({ currentName }: { currentName: string }) {
  const [state, formAction] = useActionState(async (_prev: string | null, formData: FormData) => {
    const result = await updateName(formData);
    if ("error" in result) return result.error;
    return "saved";
  }, null);

  return (
    <form action={formAction}>
      <label htmlFor="name" style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem" }}>
        Display name
      </label>
      <p style={{ color: "#6B6B6B", fontSize: "0.875rem", margin: "0 0 0.5rem" }}>
        Shown on your paywall pages as "by [name]"
      </p>
      <input
        id="name"
        name="name"
        type="text"
        defaultValue={currentName}
        maxLength={60}
        required
        style={{
          display: "block",
          width: "100%",
          padding: "10px 14px",
          border: "1.5px solid #E5E5E5",
          borderRadius: "12px",
          fontSize: "1rem",
          marginBottom: "0.75rem",
          boxSizing: "border-box",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "10px 24px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: "100px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Save
      </button>
      {state === "saved" && (
        <span style={{ marginLeft: "1rem", color: "#1A7A4A", fontSize: "0.9rem" }}>Saved ✓</span>
      )}
      {state && state !== "saved" && (
        <span style={{ marginLeft: "1rem", color: "#C0392B", fontSize: "0.9rem" }}>{state}</span>
      )}
    </form>
  );
}
