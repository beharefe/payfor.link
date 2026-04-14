import { getDMSansFonts } from "@unseallink/lib/og-font";
import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTitle = searchParams.get("title") ?? "Sell any link, instantly.";
  const seller   = searchParams.get("seller") ?? "";
  const title = rawTitle.length > 46 ? `${rawTitle.slice(0, 44)}…` : rawTitle;

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
        background: "#F5F4EF",
        fontFamily: fonts ? "DM Sans" : "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative concentric rings — bottom-right corner */}
      <div
        style={{
          position: "absolute", right: -155, bottom: -198,
          width: 580, height: 580, borderRadius: 9999,
          border: "2px solid rgba(17,17,17,0.065)", display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute", right: -75, bottom: -125,
          width: 400, height: 400, borderRadius: 9999,
          border: "1.5px solid rgba(17,17,17,0.05)", display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute", right: 14, bottom: -62,
          width: 242, height: 242, borderRadius: 9999,
          border: "1px solid rgba(17,17,17,0.038)", display: "flex",
        }}
      />

      {/* Top row: wordmark left · fee badge right */}
      <div
        style={{
          position: "absolute",
          top: 52,
          left: 64,
          right: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: "#111111",
            letterSpacing: "-0.5px",
          }}
        >
          unseal.link
        </span>
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
              fontSize: 21,
              fontWeight: 500,
              color: "#6B6B6B",
              letterSpacing: "-0.3px",
            }}
          >
            4.5% per sale
          </span>
        </div>
      </div>

      {/* Main content: optional seller italic + headline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 64,
          paddingRight: 120,
          paddingTop: 140,
          paddingBottom: 110,
          height: "100%",
          gap: 14,
        }}
      >
        {seller && (
          <div
            style={{
              fontSize: 48,
              fontWeight: 400,
              fontStyle: "italic",
              color: "#999999",
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            {seller.length > 32 ? `${seller.slice(0, 30)}…` : seller}
          </div>
        )}
        <div
          style={{
            fontSize: seller ? 88 : 108,
            fontWeight: 700,
            color: "#111111",
            lineHeight: 1.02,
            letterSpacing: "-3px",
            maxWidth: "980px",
          }}
        >
          {title}
        </div>
      </div>

      {/* Bottom bar: separator + CTA pill + tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 108,
          borderTop: "1px solid rgba(17,17,17,0.1)",
          paddingLeft: 64,
          paddingRight: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            background: "#111111",
            color: "#F5F4EF",
            fontSize: 26,
            fontWeight: 500,
            padding: "14px 32px",
            borderRadius: 100,
            display: "flex",
            letterSpacing: "-0.3px",
          }}
        >
          Start Selling →
        </div>
        <span
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: "#9E9A93",
            letterSpacing: "-0.3px",
          }}
        >
          No uploads · No payout minimum
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: fonts
        ? [
            { name: "DM Sans", data: fonts.medium,  weight: 500, style: "normal"  },
            { name: "DM Sans", data: fonts.bold,    weight: 700, style: "normal"  },
            { name: "DM Sans", data: fonts.italic,  weight: 400, style: "italic"  },
          ]
        : [],
    },
  );

  res.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  return res;
}
