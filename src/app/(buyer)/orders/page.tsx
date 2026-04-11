import { verifySessionValue } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { OrdersSignIn } from "./orders-sign-in";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your purchases",
  robots: { index: false },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; oid?: string }>;
}) {
  const { error, oid } = await searchParams;
  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("buyer_session")?.value ?? "");

  if (!session) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <a
              href="/"
              className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 hover:text-foreground transition-colors no-underline block"
            >
              unseal.link
            </a>
            <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2">
              {oid ? "Get access link" : "Your purchases"}
            </h1>
            {error === "link_expired" ? (
              <p className="text-destructive text-sm">
                That link has expired. Enter your email to get a new one.
              </p>
            ) : oid ? (
              <p className="text-muted-foreground text-sm">
                Enter the email you used at checkout to resend your access link.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Enter the email you used at checkout.
              </p>
            )}
          </div>
          <OrdersSignIn oid={oid} />
        </div>
      </main>
    );
  }

  const service = createServiceClient();
  const { data: orders } = await service
    .from(TABLES.ORDERS)
    .select("id, product_title, price_paid, currency, created_at, status, seller_id")
    .eq("buyer_email", session.email)
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Mode 1: specific order featured (via ?oid=)
  const featuredOrder = oid ? (orders ?? []).find((o) => o.id === oid) : null;

  if (featuredOrder) {
    const otherOrders = (orders ?? []).filter((o) => o.id !== oid);

    const { data: seller } = await service
      .from(TABLES.SELLERS)
      .select("name")
      .eq("id", featuredOrder.seller_id)
      .single();

    const shortId = featuredOrder.id.slice(0, 8).toUpperCase();

    return (
      <main className="min-h-dvh bg-background">
        <div className="max-w-sm mx-auto px-6 py-12 flex flex-col gap-5">
          {/* Logo */}
          <a
            href="/"
            className="text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors no-underline text-center block"
          >
            unseal.link
          </a>

          {/* Receipt card */}
          <div className="border border-border rounded-2xl bg-card overflow-hidden">
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                Your purchase
              </p>
              <p className="font-medium text-foreground leading-snug mb-0.5">
                {featuredOrder.product_title}
              </p>
              {seller?.name && (
                <p className="text-sm text-muted-foreground mb-4">by {seller.name}</p>
              )}
              <div className="border-t border-border pt-4 flex flex-col gap-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount paid</span>
                  <span className="font-medium text-foreground">
                    ${featuredOrder.price_paid.toFixed(2)}{" "}
                    {featuredOrder.currency.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">{formatDate(featuredOrder.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order</span>
                  <span className="text-foreground font-mono text-xs">#{shortId}</span>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              {featuredOrder.status === "refunded" ? (
                <p className="text-center text-sm text-muted-foreground py-2">
                  This order was refunded
                </p>
              ) : (
                <a
                  href={`${appUrl}/api/orders/${featuredOrder.id}/access`}
                  className="flex items-center justify-center w-full px-6 py-3.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-base hover:opacity-90 transition-opacity"
                >
                  Open link →
                </a>
              )}
            </div>
          </div>

          {/* Previous orders accordion */}
          {otherOrders.length > 0 && (
            <details className="group border border-border rounded-2xl bg-card overflow-hidden">
              <summary className="px-5 py-4 flex items-center justify-between cursor-pointer select-none list-none text-sm font-medium text-foreground">
                <span>Your other purchases ({otherOrders.length})</span>
                <ChevronDown className="size-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="border-t border-border divide-y divide-border">
                {otherOrders.map((order) => (
                  <div key={order.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {order.product_title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(order.created_at)} · ${order.price_paid.toFixed(2)}{" "}
                        {order.currency.toUpperCase()}
                      </p>
                    </div>
                    {order.status === "refunded" ? (
                      <span className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1 shrink-0">
                        Refunded
                      </span>
                    ) : (
                      <a
                        href={`${appUrl}/api/orders/${order.id}/access`}
                        className="text-xs font-medium text-foreground hover:opacity-60 transition-opacity shrink-0 no-underline"
                      >
                        Open →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          <a
            href="/api/buyer-signout"
            className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Sign out
          </a>
        </div>
      </main>
    );
  }

  // Mode 2: all orders list
  return (
    <main className="min-h-dvh bg-background">
      <div className="max-w-sm mx-auto px-6 py-12">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <a
              href="/"
              className="text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              unseal.link
            </a>
            <h1 className="text-2xl font-medium tracking-tight text-foreground mt-1">
              Your purchases
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{session.email}</p>
          </div>
          <a
            href="/api/buyer-signout"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline shrink-0 mt-1"
          >
            Sign out →
          </a>
        </div>

        {!orders?.length ? (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center">
            <p className="text-muted-foreground text-sm">
              No purchases found for {session.email}.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-2xl bg-card divide-y divide-border overflow-hidden">
            {orders.map((order) => (
              <div key={order.id} className="px-5 py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate mb-0.5">
                    {order.product_title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)} · ${order.price_paid.toFixed(2)}{" "}
                    {order.currency.toUpperCase()}
                  </p>
                </div>
                {order.status === "refunded" ? (
                  <span className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1 shrink-0">
                    Refunded
                  </span>
                ) : (
                  <a
                    href={`${appUrl}/api/orders/${order.id}/access`}
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-xs whitespace-nowrap hover:opacity-90 transition-opacity shrink-0"
                  >
                    Open →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
