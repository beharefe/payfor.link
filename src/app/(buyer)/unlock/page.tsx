import { createServiceClient } from "@payforlink/lib/supabase/server";
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
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Invalid link</h1>
        <p>No token provided.</p>
        <p>
          <Link href="/orders">View your orders</Link>
        </p>
      </main>
    );
  }

  const supabase = createServiceClient();
  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

  const { data: unlockToken } = await supabase
    .from("unlock_tokens")
    .select("id, purchase_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .single();

  if (!unlockToken) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Invalid link</h1>
        <p>This link is invalid or has already been used.</p>
        <p>
          <Link href="/orders">View your orders</Link>
        </p>
      </main>
    );
  }

  if (unlockToken.used_at) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Already used</h1>
        <p>This link has already been used.</p>
        <p>
          <Link href="/orders">View your orders</Link>
        </p>
      </main>
    );
  }

  if (new Date(unlockToken.expires_at) < new Date()) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Link expired</h1>
        <p>This link has expired.</p>
        <p>
          <Link href="/orders">View your orders</Link>
        </p>
      </main>
    );
  }

  const { data: purchase } = await supabase
    .from("purchases")
    .select("delivery_url, status")
    .eq("id", unlockToken.purchase_id)
    .single();

  if (!purchase || purchase.status === "refunded") {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Access denied</h1>
        <p>This order is no longer valid.</p>
        <p>
          <Link href="/orders">View your orders</Link>
        </p>
      </main>
    );
  }

  await supabase
    .from("unlock_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", unlockToken.id);

  redirect(purchase.delivery_url);
}
