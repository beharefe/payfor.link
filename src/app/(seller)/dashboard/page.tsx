import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { LockKeyhole } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyLinkButtons } from "./copy-link-buttons";
import {
  InitiateStripeConnectButton,
  SignOutButton,
} from "./dashboard-actions";
import { DashboardTabs } from "./dashboard-tabs";
import { SellerRealtimeNotifier } from "./realtime-notifier";
import { type DayRevenue, RevenueChart } from "./revenue-chart";

function buildChartData(
  orders: { created_at: string; price_paid: number }[],
): DayRevenue[] {
  const days: DayRevenue[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: 0,
    });
  }
  for (const order of orders) {
    const label = new Date(order.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const slot = days.find((d) => d.date === label);
    if (slot) slot.revenue += order.price_paid;
  }
  return days;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("stripe_connected, total_earned, total_fees, name, username, avatar_url")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/onboarding/name");

  const { data: links } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, title, slug, status, total_sales, total_revenue, expires_at")
    .eq("seller_id", user.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentOrders } = await supabase
    .from(TABLES.ORDERS)
    .select("created_at, price_paid")
    .eq("seller_id", user.id)
    .eq("status", "paid")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const chartData = buildChartData(recentOrders ?? []);
  const totalSales = links?.reduce((s, l) => s + (l.total_sales ?? 0), 0) ?? 0;
  const totalEarned = seller.total_earned ?? 0;

  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  const initial = seller.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <main className="min-h-dvh bg-background">
      <SellerRealtimeNotifier sellerId={user.id} />

      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-foreground no-underline">
            unseal.link
          </Link>
          <div className="flex items-center gap-3">
            <SignOutButton />
            {seller.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller.name ?? ""}
                className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium text-foreground shrink-0">
                {initial}
              </div>
            )}
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 pb-4">
          <DashboardTabs />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Stripe connect banner */}
        {!seller.stripe_connected && !!links?.length && (
          <div className="border border-border rounded-2xl p-6 bg-card flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">One step left: connect Stripe to go live</p>
              <p className="text-sm text-muted-foreground">Takes 2 minutes. Your links activate the moment Stripe approves your account.</p>
            </div>
            <InitiateStripeConnectButton />
          </div>
        )}

        {/* Revenue chart with stats */}
        <RevenueChart
          data={chartData}
          totalSales={totalSales}
          totalEarned={totalEarned}
          stripeConnected={seller.stripe_connected ?? false}
        />

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
            <div className="border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <LockKeyhole className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">No links yet</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Paste any URL, set a price, and share your paywall. Buyers pay via Stripe and get instant access.
                </p>
              </div>
              <Link
                href="/dashboard/links/new"
                className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Create your first link
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {links.map((link) => {
                const expired = isExpired(link.expires_at);
                const effectiveStatus = expired ? "expired" : link.status;
                return (
                  <div
                    key={link.id}
                    className="border border-border rounded-2xl px-5 py-4 bg-card flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-foreground truncate">{link.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          effectiveStatus === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : effectiveStatus === "expired"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                        }`}>
                          {effectiveStatus}
                        </span>
                        {link.expires_at && !expired && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0 cursor-default"
                            title={new Date(link.expires_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                          >
                            Limited
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {link.status === "draft" && !seller.stripe_connected
                          ? "Connect Stripe to activate"
                          : `${link.total_sales} sales · $${(link.total_revenue ?? 0).toFixed(2)} earned`}
                        {link.expires_at && !expired && (() => {
                          const ms = new Date(link.expires_at).getTime() - Date.now();
                          const hours = Math.floor(ms / 3600000);
                          const label = hours >= 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;
                          return <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">· expires in {label}</span>;
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {effectiveStatus === "active" && (
                        <CopyLinkButtons url={`${appUrl}/@${seller.username}/${link.slug}`} />
                      )}
                      <Link
                        href={`/dashboard/links/${link.id}`}
                        className="px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground no-underline hover:bg-muted transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
