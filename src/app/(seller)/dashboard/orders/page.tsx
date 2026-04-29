import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { Package } from "lucide-react";
import { redirect } from "next/navigation";
import { RefundButton } from "../links/[id]/link-actions";

const PM_LABELS: Record<string, { label: string; icon: string }> = {
  card: { label: "Card", icon: "💳" },
  apple_pay: { label: "Apple Pay", icon: "🍎" },
  google_pay: { label: "Google Pay", icon: "G" },
  link: { label: "Link", icon: "🔗" },
  blik: { label: "BLIK", icon: "🏦" },
  sepa_debit: { label: "SEPA", icon: "🏦" },
  us_bank_account: { label: "ACH", icon: "🏦" },
  alipay: { label: "Alipay", icon: "💳" },
  wechat_pay: { label: "WeChat Pay", icon: "💳" },
  cashapp: { label: "Cash App", icon: "💸" },
};

function PaymentMethodBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const info = PM_LABELS[type] ?? { label: type, icon: "💳" };
  return (
    <span className="text-[11px] px-1.5 py-0.5 bg-muted border border-border rounded text-muted-foreground font-normal">
      {info.icon} {info.label}
    </span>
  );
}

export default async function DashboardOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("id")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/onboarding/name");

  const { data: orders } = await supabase
    .from(TABLES.ORDERS)
    .select("id, created_at, buyer_email, product_title, price_paid, currency, status, product_id, payment_method_type")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
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
                  className="px-4 sm:px-5 py-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm truncate">{order.product_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.buyer_email}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-foreground tabular-nums">${order.price_paid.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === "paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : order.status === "refunded"
                          ? "bg-muted text-muted-foreground"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {order.status}
                    </span>
                    <PaymentMethodBadge type={order.payment_method_type ?? null} />
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
