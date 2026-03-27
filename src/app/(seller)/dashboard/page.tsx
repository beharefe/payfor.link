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
    .select("stripe_connected, total_earned, total_fees, name, username")
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
  // Build app URL from headers so it's correct in every environment
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  return (
    <main className="min-h-screen bg-background">
      <SellerRealtimeNotifier sellerId={user.id} />

      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <h1 className="text-base font-medium text-foreground">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/settings"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              Settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Stripe connect banner */}
        {!seller?.stripe_connected && (
          <div className="border border-border rounded-2xl p-6 bg-card flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">Connect Stripe to start selling</p>
              <p className="text-sm text-muted-foreground">Takes about 2 minutes. Stripe handles identity verification and payouts.</p>
            </div>
            <InitiateStripeConnectButton />
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="border border-border rounded-2xl p-5 bg-card">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Total earned</p>
            <p className="text-3xl font-medium text-foreground">${totalEarned.toFixed(2)}</p>
          </div>
          <div className="border border-border rounded-2xl p-5 bg-card">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Platform fees</p>
            <p className="text-3xl font-medium text-foreground">${totalFees.toFixed(2)}</p>
          </div>
          <div className="border border-border rounded-2xl p-5 bg-card">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Available</p>
            <p className="text-3xl font-medium text-foreground">${balance.toFixed(2)}</p>
            {seller?.stripe_connected && (
              <div className="mt-3">
                <WithdrawButton />
              </div>
            )}
          </div>
        </div>

        {/* Links */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your links</p>
            <Link
              href="/dashboard/links/new"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
            >
              + New link
            </Link>
          </div>

          {!links?.length ? (
            <div className="border border-dashed border-border rounded-2xl p-12 text-center">
              <p className="text-muted-foreground mb-4">No links yet.</p>
              <Link
                href="/dashboard/links/new"
                className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Create your first link
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="border border-border rounded-2xl px-5 py-4 bg-card flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-foreground truncate">{link.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        link.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {link.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {link.total_sales} sales · ${link.total_revenue.toFixed(2)} earned
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CopyLinkButtons
                      url={`${appUrl}/@${seller?.username}/${link.slug}`}
                    />
                    <Link
                      href={`/dashboard/links/${link.id}`}
                      className="px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground no-underline hover:bg-muted transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
