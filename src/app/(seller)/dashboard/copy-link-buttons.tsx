"use client";

export function CopyLinkButtons({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(url);
      }}
      className="mr-2"
    >
      Copy URL
    </button>
  );
}
