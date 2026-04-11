import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { ImageResponse } from "next/og";

export const runtime = "edge";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = createServiceClient();
  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select("title, description, price, currency, preview_image_url, seller_id, status")
    .eq("slug", slug)
    .not("status", "in", '("deleted","suspended")')
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

  // Validate image before rendering — broken URLs leave an empty panel
  const IMAGE_W = 420;
  const IMAGE_H = 630;
  let imageUrl: string | null = null;
  if (link.preview_image_url) {
    const transformedUrl = toTransformUrl(link.preview_image_url, IMAGE_W, IMAGE_H);
    const reachable = await isImageReachable(transformedUrl);
    imageUrl = reachable ? transformedUrl : null;
  }

  const hasImage = Boolean(imageUrl);

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
      {/* Image panel */}
      {hasImage && (
        <div
          style={{
            width: `${IMAGE_W}px`,
            height: `${IMAGE_H}px`,
            flexShrink: 0,
            overflow: "hidden",
            display: "flex",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl!}
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

      {/* Content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: hasImage ? "56px 64px 56px 44px" : "72px 80px",
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
            <div style={{ fontSize: "22px", color: "#6B6B6B", fontWeight: 400 }}>
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
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#111111" }}>
            {price}
          </div>
          <div style={{ fontSize: "18px", color: "#6B6B6B", fontWeight: 400, letterSpacing: "-0.3px" }}>
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
