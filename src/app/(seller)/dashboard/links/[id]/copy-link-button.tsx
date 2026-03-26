"use client";

export function CopyLinkButton({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(url)}
      className="mt-2 px-4 py-2"
    >
      Copy link
    </button>
  );
}
