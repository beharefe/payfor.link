import { getDMSansFonts } from "@unseallink/lib/og-font";
import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title  = searchParams.get("t") ?? "";
  const price  = searchParams.get("p") ?? "";
  const seller = searchParams.get("s") ?? "";

  let fonts: Awaited<ReturnType<typeof getDMSansFonts>> | null = null;
  try {
    fonts = await getDMSansFonts();
  } catch {
    // Falls back to system sans-serif
  }

  // Dark palette — high contrast against all social platform backgrounds
  const BG   = "#111111";
  const FG   = "#F5F4EF"; // cream: primary text + CTA pill
  const MUTED = "#888888"; // secondary text
  const RING  = "rgba(245,244,239,0.065)";

  const displayTitle = title.length > 38 ? `${title.slice(0, 37)}…` : title;

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
      {/* Decorative rings — top-right */}
      <div style={{ position: "absolute", right: -120, top: -160, width: 460, height: 460, borderRadius: 9999, border: `1.5px solid ${RING}`, display: "flex" }} />
      <div style={{ position: "absolute", right: -52,  top: -92,  width: 304, height: 304, borderRadius: 9999, border: `1px solid ${RING}`,   display: "flex" }} />
      <div style={{ position: "absolute", right:  18,  top: -36,  width: 172, height: 172, borderRadius: 9999, border: `1px solid rgba(245,244,239,0.04)`, display: "flex" }} />

      {/* Content panel — full width */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          paddingTop: "52px",
          paddingRight: "80px",
          paddingBottom: "88px",
          paddingLeft: "80px",
        }}
      >
        {/* Top: unseal.link badge */}
        <div style={{ display: "flex", marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              border: "1.5px solid rgba(245,244,239,0.18)",
              borderRadius: 100,
              padding: "8px 20px",
            }}
          >
            <span style={{ fontSize: "19px", fontWeight: 500, color: MUTED, letterSpacing: "-0.2px" }}>
              unseal.link
            </span>
          </div>
        </div>

        {/* Title + seller */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
          <div style={{ fontSize: "72px", fontWeight: 700, color: FG, lineHeight: 1.1, letterSpacing: "-1.5px" }}>
            {displayTitle}
          </div>
          {seller && (
            <div style={{ display: "flex", fontSize: "27px", fontStyle: "italic", fontWeight: 400, color: MUTED, letterSpacing: "-0.4px" }}>
              by {seller}
            </div>
          )}
        </div>

        {/* Price + Buy now */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "88px", fontWeight: 700, color: FG, letterSpacing: "-2.5px", lineHeight: 1 }}>
            {price}
          </div>
          <div
            style={{
              display: "flex",
              background: FG,
              color: BG,
              fontSize: "34px",
              fontWeight: 500,
              padding: "22px 44px",
              borderRadius: 100,
              letterSpacing: "-0.3px",
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
            { name: "DM Sans", data: fonts.medium, weight: 500, style: "normal" },
            { name: "DM Sans", data: fonts.bold,   weight: 700, style: "normal" },
            { name: "DM Sans", data: fonts.italic, weight: 400, style: "italic" },
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
