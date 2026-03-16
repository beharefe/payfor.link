import { createClient, createServiceClient } from "@payforlink/lib/supabase/server";

const PLATFORM_LABELS: Record<string, string> = {
  "notion.so": "Notion",
  "notion.site": "Notion",
  "figma.com": "Figma",
  "docs.google.com": "Google Docs",
  "drive.google.com": "Google Drive",
  "sheets.google.com": "Google Sheets",
  "github.com": "GitHub",
  "canva.com": "Canva",
  "airtable.com": "Airtable",
};

function getPlatformLabel(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return PLATFORM_LABELS[host] ?? "resource";
  } catch {
    return "resource";
  }
}

type Props = { params: Promise<{ purchase_id: string }> };

export default async function DeliveryPage({ params }: Props) {
  const { purchase_id } = await params;
  const service = createServiceClient();

  const { data: purchase } = await service
    .from("purchases")
    .select("id, buyer_email, buyer_email_verified, delivery_url, product_title, created_at, seller_id")
    .eq("id", purchase_id)
    .single();

  if (!purchase) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Access denied</h1>
        <p>This purchase could not be found.</p>
      </main>
    );
  }

  // Allow access if: OTP was verified (post-purchase flow), OR authenticated user owns this purchase
  let hasAccess = purchase.buyer_email_verified;
  if (!hasAccess) {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    hasAccess = !!user?.email && user.email === purchase.buyer_email;
  }

  if (!hasAccess) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Access denied</h1>
        <p>This purchase could not be verified.</p>
      </main>
    );
  }

  const { data: seller } = await service
    .from("users")
    .select("name")
    .eq("id", purchase.seller_id)
    .single();

  const platform = getPlatformLabel(purchase.delivery_url);
  const purchasedOn = new Date(purchase.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = purchase.id.slice(0, 8).toUpperCase();

  return (
    <main style={{ padding: "2rem", maxWidth: "30rem", margin: "0 auto", textAlign: "center" }}>
      <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</p>
      <h1 style={{ marginBottom: "0.25rem" }}>Purchase verified</h1>
      <h2 style={{ fontWeight: "normal", fontSize: "1.1rem", marginBottom: "0.25rem" }}>
        {purchase.product_title}
      </h2>
      {seller?.name && (
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>by {seller.name}</p>
      )}

      <a
        href={purchase.delivery_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          background: "#000",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "6px",
          fontWeight: "600",
          fontSize: "1rem",
          marginBottom: "1rem",
        }}
      >
        Open {platform} →
      </a>

      <hr style={{ margin: "1.5rem 0", borderColor: "#eee" }} />

      <p style={{ color: "#999", fontSize: "0.85rem" }}>
        Purchased on {purchasedOn} · Order #{shortId}
      </p>
    </main>
  );
}
