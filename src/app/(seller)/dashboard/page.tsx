import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InitiateStripeConnectButton, SignOutButton } from "./dashboard-actions";
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

  const { data: recentOrders } = await supabase
    .from(TABLES.ORDERS)
    .select("created_at, price_paid")
    .eq("seller_id", user.id)
    .eq("status", "paid")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { data: links } = await supabase
    .from(TABLES.PRODUCTS)
    .select("total_sales")
    .eq("seller_id", user.id)
    .neq("status", "deleted");

  const chartData = buildChartData(recentOrders ?? []);
  const totalSales = links?.reduce((s, l) => s + (l.total_sales ?? 0), 0) ?? 0;
  const totalEarned = seller.total_earned ?? 0;

  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
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
              <img src={seller.avatar_url} alt={seller.name ?? ""} className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
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

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
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

        {/* Revenue chart with stats */}
        <RevenueChart
          data={chartData}
          totalSales={totalSales}
          totalEarned={totalEarned}
          stripeConnected={seller.stripe_connected ?? false}
        />
      </div>
    </main>
  );
}
