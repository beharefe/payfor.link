import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InitiateStripeConnectButton } from "./dashboard-actions";
import { PromotionBanners } from "./promotion-banners";
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("stripe_connected, total_earned, total_fees, name, username, avatar_url")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/onboarding/name");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: recentOrders }, { data: latestLinks }, { data: latestOrders }] =
    await Promise.all([
      supabase
        .from(TABLES.ORDERS)
        .select("created_at, price_paid")
        .eq("seller_id", user.id)
        .eq("status", "paid")
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from(TABLES.PRODUCTS)
        .select("id, title, slug, status, total_sales, price")
        .eq("seller_id", user.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from(TABLES.ORDERS)
        .select("id, product_title, buyer_email, price_paid, created_at, status")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const chartData = buildChartData(recentOrders ?? []);
  const totalSales = latestLinks?.reduce((s, l) => s + (l.total_sales ?? 0), 0) ?? 0;
  const totalEarned = seller.total_earned ?? 0;
  const hasLinks = (latestLinks?.length ?? 0) > 0;

  return (
    <main>
      <SellerRealtimeNotifier sellerId={user.id} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Active promotions — shown when seller has fee waivers or credits */}
        <PromotionBanners sellerId={user.id} />

        {/* Stripe connect banner */}
        {!seller.stripe_connected && (
          <div className="border border-border rounded-2xl p-5 bg-card flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">One step left: connect Stripe to go live</p>
              <p className="text-sm text-muted-foreground">Takes 2 minutes. Your links activate the moment Stripe approves your account.</p>
            </div>
            <InitiateStripeConnectButton />
          </div>
        )}

        {/* Revenue chart */}
        <RevenueChart
          data={chartData}
          totalSales={totalSales}
          totalEarned={totalEarned}
          stripeConnected={seller.stripe_connected ?? false}
          hasLinks={hasLinks}
        />

        {/* Latest links + orders */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Latest links */}
          <div className="border border-border rounded-2xl bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Latest links</p>
              <Link href="/dashboard/links" className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline">
                All →
              </Link>
            </div>
            {!latestLinks?.length ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No links yet</p>
                <Link
                  href="/dashboard/links/new"
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  + New link
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={`/dashboard/links/${link.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors no-underline"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">${link.price.toFixed(2)} · {link.total_sales} sales</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-3 ${
                      link.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {link.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Latest orders */}
          <div className="border border-border rounded-2xl bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Latest orders</p>
              <Link href="/dashboard/orders" className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline">
                All →
              </Link>
            </div>
            {!latestOrders?.length ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{order.product_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.buyer_email}</p>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <p className="text-sm font-medium text-foreground tabular-nums">${order.price_paid.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
