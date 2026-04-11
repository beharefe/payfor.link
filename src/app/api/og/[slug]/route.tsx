import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title  = searchParams.get("t") ?? "";
  const price  = searchParams.get("p") ?? "";
  const seller = searchParams.get("s") ?? "";
  const imgSrc = searchParams.get("i") ?? "";

  const hasImage = Boolean(imgSrc);
  const IMAGE_W = 420;

  // Attempt to load the preview image — wrap in try/catch so a bad URL
  // falls back to the text-only layout rather than a 500 error.
  let resolvedImg: string | null = null;
  if (hasImage) {
    try {
      const res = await fetch(imgSrc, { signal: AbortSignal.timeout(3000) });
      if (res.ok) resolvedImg = imgSrc;
    } catch {
      resolvedImg = null;
    }
  }

  const imageResponse = new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "#F5F4EF",
        fontFamily: "sans-serif",
      }}
    >
      {/* Left: preview image panel */}
      {resolvedImg && (
        <div
          style={{
            width: `${IMAGE_W}px`,
            height: "630px",
            flexShrink: 0,
            display: "flex",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedImg}
            alt=""
            style={{ width: `${IMAGE_W}px`, height: "630px", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, transparent 60%, #F5F4EF 100%)",
            }}
          />
        </div>
      )}

      {/* Right: content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: resolvedImg ? "56px 64px 56px 44px" : "72px 80px",
        }}
      >
        {/* Top badge */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              background: "#111111",
              color: "#F5F4EF",
              fontSize: "14px",
              fontWeight: 500,
              padding: "6px 16px",
              borderRadius: "100px",
            }}
          >
            unseal.link
          </div>
        </div>

        {/* Title + seller */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              fontSize: resolvedImg ? "42px" : "56px",
              fontWeight: 700,
              color: "#111111",
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            {title.length > 58 ? `${title.slice(0, 56)}…` : title}
          </div>
          {seller && (
            <div style={{ fontSize: "22px", color: "#6B6B6B", fontWeight: 400 }}>
              by {seller}
            </div>
          )}
        </div>

        {/* Price */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "44px",
              fontWeight: 700,
              color: "#111111",
              letterSpacing: "-1px",
            }}
          >
            {price}
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "18px",
              fontWeight: 600,
              color: "#3D3530",
              letterSpacing: "-0.3px",
            }}
          >
            unseal.link
          </div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );

  imageResponse.headers.set(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );

  return imageResponse;
}
