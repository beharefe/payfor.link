import { ImageResponse } from "next/og";

// Convert Supabase public URL to a transform URL for resizing at the CDN level.
// Requires Supabase Pro. Falls back to original URL on non-Pro plans (transform returns 400).
function toTransformUrl(url: string, width: number, height: number): string {
  // e.g. https://xxx.supabase.co/storage/v1/object/public/bucket/path
  //   → https://xxx.supabase.co/storage/v1/render/image/public/bucket/path?width=…
  try {
    const u = new URL(url);
    const objectIdx = u.pathname.indexOf("/object/public/");
    if (objectIdx === -1) return url;
    const rest = u.pathname.slice(objectIdx + "/object".length); // /public/bucket/path
    u.pathname = `/storage/v1/render/image${rest}`;
    u.searchParams.set("width", String(width));
    u.searchParams.set("height", String(height));
    u.searchParams.set("resize", "cover");
    u.searchParams.set("quality", "80");
    return u.toString();
  } catch {
    return url;
  }
}

async function isImageReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title  = searchParams.get("t") ?? "";
  const price  = searchParams.get("p") ?? "";
  const seller = searchParams.get("s") ?? "";
  const imgSrc = searchParams.get("i") ?? "";

  const IMAGE_W = 420;
  const IMAGE_H = 630;

  // Validate image before rendering — broken URLs leave an empty panel.
  // Try a transform URL first (CDN resize), fall back to original if unreachable.
  let resolvedImg: string | null = null;
  if (imgSrc) {
    const transformedUrl = toTransformUrl(imgSrc, IMAGE_W, IMAGE_H);
    const reachable = await isImageReachable(transformedUrl);
    resolvedImg = reachable ? transformedUrl : null;
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
            height: `${IMAGE_H}px`,
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
            style={{ width: `${IMAGE_W}px`, height: `${IMAGE_H}px`, objectFit: "cover" }}
          />
          {/* Gradient fade → blends image into content panel */}
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
        {/* Top: badge */}
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

  // Cache aggressively — crawlers hit this on every unfurl
  imageResponse.headers.set(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );

  return imageResponse;
}
