import { getDMSansFonts } from "@unseallink/lib/og-font";
import { ImageResponse } from "next/og";

export const runtime = "edge";

// Convert Supabase public URL to a transform URL for resizing at the CDN level.
// Requires Supabase Pro. Falls back to original URL on non-Pro plans (transform returns 400).
function toTransformUrl(url: string, width: number, height: number): string {
  try {
    const u = new URL(url);
    const objectIdx = u.pathname.indexOf("/object/public/");
    if (objectIdx === -1) return url;
    const rest = u.pathname.slice(objectIdx + "/object".length);
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

// Fetch image bytes and return an inlined base64 data URL.
// Using a data URL means Satori never makes a remote fetch — eliminates HEAD/GET
// discrepancies (Supabase storage often 405s on HEAD), CORS surprises, and
// Satori's own silent fetch failures on Edge runtime.
// Edge runtime has no Node Buffer — use Uint8Array + btoa instead.
async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${contentType};base64,${btoa(binary)}`;
  } catch {
    return null;
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

  let resolvedImg: string | null = null;
  if (imgSrc) {
    const transformedUrl = toTransformUrl(imgSrc, IMAGE_W, IMAGE_H);
    // Try CDN transform first (Supabase Pro), fall back to original URL
    const candidates = transformedUrl !== imgSrc ? [transformedUrl, imgSrc] : [imgSrc];
    for (const url of candidates) {
      const data = await fetchAsDataUrl(url);
      if (data) { resolvedImg = data; break; }
    }
  }

  let fonts: Awaited<ReturnType<typeof getDMSansFonts>> | null = null;
  try {
    fonts = await getDMSansFonts();
  } catch {
    // Falls back to system sans-serif
  }

  // Dark palette — high contrast against all social platform backgrounds
  const BG     = "#111111";
  const FG     = "#F5F4EF"; // cream: primary text + CTA pill
  const MUTED  = "#888888"; // secondary text
  const RING   = "rgba(245,244,239,0.065)";

  // Truncate title to 2 lines: narrower panel (with image) needs fewer chars
  const truncAt = resolvedImg ? 32 : 38;
  const displayTitle = title.length > truncAt ? `${title.slice(0, truncAt - 1)}…` : title;

  // Content padding: tighter when sharing space with the image
  const pad = resolvedImg
    ? { t: "52px", r: "60px", b: "52px", l: "40px" }
    : { t: "60px", r: "80px", b: "60px", l: "80px" };

  // Font sizes adapt to available panel width
  const titleSize = resolvedImg ? "58px" : "72px";
  const priceSize = resolvedImg ? "74px" : "88px";

  const imageResponse = new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: BG,
        fontFamily: fonts ? "DM Sans" : "sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Decorative rings — top-right — cream on dark */}
      <div style={{ position: "absolute", right: -120, top: -160, width: 460, height: 460, borderRadius: 9999, border: `1.5px solid ${RING}`, display: "flex" }} />
      <div style={{ position: "absolute", right: -52,  top: -92,  width: 304, height: 304, borderRadius: 9999, border: `1px solid ${RING}`,   display: "flex" }} />
      <div style={{ position: "absolute", right:  18,  top: -36,  width: 172, height: 172, borderRadius: 9999, border: `1px solid rgba(245,244,239,0.04)`, display: "flex" }} />

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
          {/* Fade image into the dark content panel */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to right, transparent 45%, ${BG} 94%)`,
            }}
          />
        </div>
      )}

      {/* Content panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: pad.t,
          paddingRight: pad.r,
          paddingBottom: pad.b,
          paddingLeft: pad.l,
        }}
      >
        {/* Top: unseal.link badge — small, outlined, unobtrusive */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              border: `1.5px solid rgba(245,244,239,0.18)`,
              borderRadius: 100,
              padding: "8px 20px",
            }}
          >
            <span
              style={{
                fontSize: "19px",
                fontWeight: 500,
                color: MUTED,
                letterSpacing: "-0.2px",
              }}
            >
              unseal.link
            </span>
          </div>
        </div>

        {/* Middle: product title + seller */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              color: FG,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
            }}
          >
            {displayTitle}
          </div>
          {seller && (
            <div
              style={{
                fontSize: "27px",
                fontStyle: "italic",
                fontWeight: 400,
                color: MUTED,
                letterSpacing: "-0.4px",
              }}
            >
              by {seller}
            </div>
          )}
        </div>

        {/* Bottom: price (dominant) + Buy now CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Price — the biggest, most visible element */}
          <div
            style={{
              fontSize: priceSize,
              fontWeight: 700,
              color: FG,
              letterSpacing: "-2.5px",
              lineHeight: 1,
            }}
          >
            {price}
          </div>

          {/* CTA pill — cream on dark, inverted from the site's normal dark-on-cream */}
          <div
            style={{
              display: "flex",
              background: FG,
              color: BG,
              fontSize: "23px",
              fontWeight: 500,
              padding: "15px 30px",
              borderRadius: 100,
              letterSpacing: "-0.2px",
            }}
          >
            Buy now →
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: fonts
        ? [
            { name: "DM Sans", data: fonts.medium, weight: 500, style: "normal"  },
            { name: "DM Sans", data: fonts.bold,   weight: 700, style: "normal"  },
            { name: "DM Sans", data: fonts.italic, weight: 400, style: "italic"  },
          ]
        : [],
    },
  );

  imageResponse.headers.set(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );

  return imageResponse;
}
