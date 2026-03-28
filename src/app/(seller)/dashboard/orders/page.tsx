import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { Package } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "../dashboard-actions";
import { DashboardTabs } from "../dashboard-tabs";
import { RefundButton } from "../links/[id]/link-actions";

export default async function DashboardOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/onboarding/name");

  const { data: orders } = await supabase
    .from(TABLES.ORDERS)
    .select("id, created_at, buyer_email, product_title, price_paid, currency, status, product_id")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const initial = seller.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <main className="min-h-dvh bg-background">
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

      <div className="max-w-5xl mx-auto px-6 py-10">
        {!orders?.length ? (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">No orders yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                When buyers purchase your links, their orders will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-2xl overflow-hidden bg-card">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{order.product_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.buyer_email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      ${order.price_paid.toFixed(2)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === "paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : order.status === "refunded"
                          ? "bg-muted text-muted-foreground"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {order.status === "paid" && (
                      <RefundButton orderId={order.id} buyerEmail={order.buyer_email} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
