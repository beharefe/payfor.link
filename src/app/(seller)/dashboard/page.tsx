import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyLinkButtons } from "./copy-link-buttons";
import {
  InitiateStripeConnectButton,
  SignOutButton,
  WithdrawButton,
} from "./dashboard-actions";
import { SellerRealtimeNotifier } from "./realtime-notifier";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("stripe_connected, total_earned, total_fees")
    .eq("id", user.id)
    .single();

  const { data: links } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, title, slug, status, total_sales, total_revenue")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const totalEarned = seller?.total_earned ?? 0;
  const totalFees = seller?.total_fees ?? 0;
  const balance = totalEarned - totalFees;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main style={{ padding: "2rem", maxWidth: "48rem", margin: "0 auto" }}>
      <SellerRealtimeNotifier sellerId={user.id} />
      <h1>Dashboard</h1>
      <p style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <Link href="/dashboard/settings">Settings</Link>
        <SignOutButton />
      </p>

      {!seller?.stripe_connected && (
        <section
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
          }}
        >
          <p>Connect Stripe to start selling.</p>
          <InitiateStripeConnectButton />
        </section>
      )}

      <section style={{ marginBottom: "2rem" }}>
        <h2>Earnings</h2>
        <p>Total earned: ${totalEarned.toFixed(2)}</p>
        <p>Platform fees (4.5%): -${totalFees.toFixed(2)}</p>
        <p>
          <strong>Available balance: ${balance.toFixed(2)}</strong>
        </p>
        {seller?.stripe_connected && <WithdrawButton />}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Your links</h2>
        <p>
          <Link href="/dashboard/links/new">+ Create link</Link>
        </p>
        {!links?.length ? (
          <p>No links yet. Create one to get started.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {links.map((link) => (
              <li
                key={link.id}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #eee",
                  marginBottom: "0.5rem",
                }}
              >
                <strong>{link.title}</strong> — {link.status} —{" "}
                {link.total_sales} sales — ${link.total_revenue.toFixed(2)}
                <br />
                <CopyLinkButtons url={`${appUrl}/pay/${link.slug}`} />
                <Link
                  href={`/dashboard/links/${link.id}`}
                  style={{ marginLeft: "0.5rem" }}
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
