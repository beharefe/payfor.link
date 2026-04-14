import { getDMSansFonts } from "@unseallink/lib/og-font";
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

  let fonts: Awaited<ReturnType<typeof getDMSansFonts>> | null = null;
  try {
    fonts = await getDMSansFonts();
  } catch {
    // Falls back to system sans-serif
  }

  const contentPad = resolvedImg
    ? { top: "52px", right: "64px", bottom: "52px", left: "44px" }
    : { top: "64px", right: "80px", bottom: "56px", left: "80px" };

  const imageResponse = new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "#F5F4EF",
        fontFamily: fonts ? "DM Sans" : "sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Decorative concentric rings — top-right corner (visible in content panel) */}
      <div
        style={{
          position: "absolute", right: -112, top: -152,
          width: 440, height: 440, borderRadius: 9999,
          border: "2px solid rgba(17,17,17,0.065)", display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute", right: -48, top: -88,
          width: 292, height: 292, borderRadius: 9999,
          border: "1.5px solid rgba(17,17,17,0.05)", display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute", right: 20, top: -32,
          width: 166, height: 166, borderRadius: 9999,
          border: "1px solid rgba(17,17,17,0.038)", display: "flex",
        }}
      />

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
              background: "linear-gradient(to right, transparent 50%, #F5F4EF 96%)",
            }}
          />
        </div>
      )}

      {/* Right (or full): content panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: contentPad.top,
          paddingRight: contentPad.right,
          paddingBottom: contentPad.bottom,
          paddingLeft: contentPad.left,
        }}
      >
        {/* Top: badge pill */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              background: "#111111",
              color: "#F5F4EF",
              fontSize: "21px",
              fontWeight: 500,
              padding: "9px 24px",
              borderRadius: "100px",
              display: "flex",
              letterSpacing: "-0.2px",
            }}
          >
            unseal.link
          </div>
        </div>

        {/* Middle: title + seller */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: resolvedImg ? "63px" : "84px",
              fontWeight: 700,
              color: "#111111",
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
            }}
          >
            {title.length > 38 ? `${title.slice(0, 36)}…` : title}
          </div>
          {seller && (
            <div
              style={{
                fontSize: "33px",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#999999",
                letterSpacing: "-0.5px",
              }}
            >
              by {seller}
            </div>
          )}
        </div>

        {/* Bottom: separator + price · wordmark badge */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Separator */}
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(17,17,17,0.1)",
              display: "flex",
              flexShrink: 0,
            }}
          />
          {/* Price row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: "66px",
                fontWeight: 700,
                color: "#111111",
                letterSpacing: "-2px",
                lineHeight: 1,
              }}
            >
              {price}
            </div>
            <div
              style={{
                display: "flex",
                border: "1.5px solid rgba(17,17,17,0.17)",
                borderRadius: 100,
                padding: "9px 22px",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "#3D3530",
                  letterSpacing: "-0.3px",
                }}
              >
                unseal.link
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: fonts
        ? [
            { name: "DM Sans", data: fonts.medium, weight: 500, style: "normal" },
            { name: "DM Sans", data: fonts.bold,   weight: 700, style: "normal" },
            { name: "DM Sans", data: fonts.italic, weight: 400, style: "italic" },
          ]
        : [],
    },
  );

  // Cache aggressively — crawlers hit this on every unfurl
  imageResponse.headers.set(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );

  return imageResponse;
}
