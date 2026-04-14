import { getDMSansFonts } from "@unseallink/lib/og-font";
import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTitle = searchParams.get("title") ?? "Sell any link, instantly.";
  const title = rawTitle.length > 68 ? `${rawTitle.slice(0, 66)}…` : rawTitle;

  let fonts: Awaited<ReturnType<typeof getDMSansFonts>> | null = null;
  try {
    fonts = await getDMSansFonts();
  } catch {
    // If font loading fails, ImageResponse falls back to system sans-serif
  }

  const res = new ImageResponse(
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "flex-start",
        background: "#F5F4EF",
        paddingLeft: "80px",
        paddingRight: "80px",
        fontFamily: fonts ? "DM Sans" : "sans-serif",
        letterSpacing: "-0.02em",
      }}
    >
      {/* Top-left: wordmark */}
      <div
        style={{
          position: "absolute",
          left: 42,
          top: 42,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: "#111111",
          }}
        >
          unseal.link
        </span>
      </div>

      {/* Center (vertically) — page title */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "900px",
        }}
      >
        <div
          style={{
            fontSize: "72px",
            fontWeight: 700,
            color: "#111111",
            lineHeight: 1.1,
            letterSpacing: "-2px",
          }}
        >
          {title}
        </div>
      </div>

      {/* Bottom-left: CTA pill */}
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 60,
          display: "flex",
        }}
      >
        <div
          style={{
            background: "#111111",
            color: "#F5F4EF",
            fontSize: "20px",
            fontWeight: 500,
            padding: "14px 28px",
            borderRadius: "100px",
          }}
        >
          Start Selling →
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: fonts
        ? [
            { name: "DM Sans", data: fonts.medium, weight: 500, style: "normal" },
            { name: "DM Sans", data: fonts.bold, weight: 700, style: "normal" },
          ]
        : [],
    },
  );

  res.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  return res;
}
