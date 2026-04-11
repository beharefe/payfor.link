import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  const res = new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#F5F4EF",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top tag */}
      <div
        style={{
          display: "flex",
        }}
      >
        <div
          style={{
            background: "#111111",
            color: "#F5F4EF",
            fontSize: "16px",
            fontWeight: 500,
            padding: "8px 20px",
            borderRadius: "100px",
          }}
        >
          unseal.link
        </div>
      </div>

      {/* Middle headline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
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
          Sell any link,
          <br />
          instantly.
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#6B6B6B",
            fontWeight: 400,
          }}
        >
          Paste a link, set a price, get paid.
        </div>
      </div>

      {/* Bottom trust */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            color: "#6B6B6B",
          }}
        >
          No monthly fees · Payments by{" "}
          <span style={{ color: "#635BFF", fontWeight: 600 }}>Stripe</span>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
  res.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  return res;
}
