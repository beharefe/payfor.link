"use client";

export function CopyLinkButtons({ url }: { url: string }) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url);
        }}
        style={{ marginRight: "0.5rem" }}
      >
        Copy URL
      </button>
    </>
  );
}
