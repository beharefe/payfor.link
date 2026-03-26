import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { ImageResponse } from "next/og";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = createServiceClient();
  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select("title, description, price, currency, preview_image_url, seller_id")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!link) {
    return new Response("Not found", { status: 404 });
  }

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name")
    .eq("id", link.seller_id)
    .single();

  const title = link.title;
  const sellerName = seller?.name ?? null;
  const price = `$${Number(link.price).toFixed(2)} ${(link.currency ?? "usd").toUpperCase()}`;
  const hasImage = Boolean(link.preview_image_url);

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "#F5F4EF",
        fontFamily: "sans-serif",
      }}
    >
      {/* Preview image panel */}
      {hasImage && (
        <div
          style={{
            width: "420px",
            height: "630px",
            flexShrink: 0,
            overflow: "hidden",
            display: "flex",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={link.preview_image_url!}
            alt=""
            style={{ width: "420px", height: "630px", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: hasImage ? "56px 56px 56px 52px" : "72px 80px",
        }}
      >
        {/* Top: tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
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
            Pay once, get access
          </div>
        </div>

        {/* Middle: title + author */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              fontSize: hasImage ? "44px" : "56px",
              fontWeight: 700,
              color: "#111111",
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            {title.length > 60 ? `${title.slice(0, 58)}…` : title}
          </div>
          {sellerName && (
            <div
              style={{
                fontSize: "22px",
                color: "#6B6B6B",
                fontWeight: 400,
              }}
            >
              by {sellerName}
            </div>
          )}
        </div>

        {/* Bottom: price + brand */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#111111",
            }}
          >
            {price}
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "#6B6B6B",
              fontWeight: 400,
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
}
