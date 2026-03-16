"use client";

export function CopyLinkButton({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(url)}
      style={{ marginTop: "0.5rem", padding: "0.5rem 1rem" }}
    >
      Copy link
    </button>
  );
}
