import { createServiceClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function UnlockPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token?.trim()) {
    return <UnlockError title="Invalid link" body="No token provided." />;
  }

  const supabase = createServiceClient();
  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

  const { data: unlockToken } = await supabase
    .from("unlock_tokens")
    .select("id, purchase_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .single();

  if (!unlockToken) {
    return <UnlockError title="Invalid link" body="This link is invalid or has already been used." />;
  }

  if (unlockToken.used_at) {
    return <UnlockError title="Already used" body="This link has already been used. Sign in to access your orders." />;
  }

  if (new Date(unlockToken.expires_at) < new Date()) {
    return (
      <UnlockError
        title="Link expired"
        body="This access link has expired."
        cta={{ label: "Request a new link →", href: "/unlock-request" }}
      />
    );
  }

  const { data: purchase } = await supabase
    .from("purchases")
    .select("product_title, status")
    .eq("id", unlockToken.purchase_id)
    .single();

  if (!purchase || purchase.status === "refunded") {
    return <UnlockError title="Access denied" body="This order is no longer valid." />;
  }

  // Token is valid — show confirmation screen.
  // Do NOT consume it here on GET. Email scanners pre-fetch links and would burn the token.
  // The server action below only runs when the user actively clicks the button.
  async function consumeAndRedirect() {
    "use server";
    const svc = createServiceClient();

    // Re-validate atomically before consuming
    const { data: t } = await svc
      .from("unlock_tokens")
      .select("purchase_id, used_at, expires_at")
      .eq("id", unlockToken!.id)
      .single();

    if (!t || t.used_at || new Date(t.expires_at) < new Date()) {
      redirect("/orders");
    }

    // Mark used only if still unused (race-condition guard)
    await svc
      .from("unlock_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", unlockToken!.id)
      .is("used_at", null);

    const { data: p } = await svc
      .from("purchases")
      .select("delivery_url, status")
      .eq("id", t.purchase_id)
      .single();

    if (!p || p.status === "refunded") redirect("/orders");
    redirect(p.delivery_url);
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        padding: "2rem",
        textAlign: "center",
        maxWidth: "28rem",
        margin: "0 auto",
      }}
    >
      <p style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔓</p>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.5rem" }}>
        You&apos;re one click away
      </h1>
      <p style={{ color: "#6B6B6B", marginBottom: "2rem" }}>{purchase.product_title}</p>

      <form action={consumeAndRedirect} style={{ width: "100%" }}>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px 28px",
            background: "#111111",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "100px",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Access content →
        </button>
      </form>

      <p style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "#AAAAAA" }}>
        Single-use link · expires 24h after purchase
      </p>
    </main>
  );
}

function UnlockError({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <main style={{ padding: "2rem", textAlign: "center", maxWidth: "28rem", margin: "0 auto" }}>
      <h1>{title}</h1>
      <p style={{ color: "#6B6B6B" }}>{body}</p>
      <p style={{ marginTop: "1rem" }}>
        <Link href={cta?.href ?? "/orders"}>{cta?.label ?? "View your orders"}</Link>
      </p>
    </main>
  );
}
