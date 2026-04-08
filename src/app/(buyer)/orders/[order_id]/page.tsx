import { verifySessionValue } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ReportProblem } from "./report-problem";

export const metadata: Metadata = {
  robots: { index: false },
};

type Props = { params: Promise<{ order_id: string }> };

export default async function OrderPage({ params }: Props) {
  const { order_id } = await params;

  const service = createServiceClient();
  const { data: order } = await service
    .from(TABLES.ORDERS)
    .select(
      "id, buyer_email, product_id, product_title, price_paid, currency, created_at, status, seller_id",
    )
    .eq("id", order_id)
    .single();

  if (!order) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-medium text-foreground mb-2">Order not found</h1>
          <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← All orders</Link>
        </div>
      </main>
    );
  }

  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("buyer_session")?.value ?? "");

  if (!session || session.email.toLowerCase() !== order.buyer_email.toLowerCase()) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-sm text-center">
          <p className="text-3xl mb-4">🔒</p>
          <h1 className="text-2xl font-medium tracking-tight text-foreground mb-2">Sign in to view this</h1>
          <p className="text-muted-foreground text-sm mb-8">Use the access link from your order email, or enter your email below.</p>
          <Link
            href={`/orders?oid=${order_id}`}
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground no-underline rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Sign in →
          </Link>
        </div>
      </main>
    );
  }

  if (order.status === "refunded") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
        <p className="text-3xl mb-2">↩️</p>
        <h1 className="text-xl font-medium mb-2">Order refunded</h1>
        <p className="text-muted-foreground mb-1">{order.product_title}</p>
        <p className="text-muted-foreground text-sm mb-6">
          This order was refunded and access is no longer available.
        </p>
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← All orders
        </Link>
      </div>
      </main>
    );
  }

  const { data: seller } = await service
    .from(TABLES.SELLERS)
    .select("name, email, username")
    .eq("id", order.seller_id)
    .single();

  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;
  const purchasedOn = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <main className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center mb-2">
          <p className="text-4xl mb-3">✓</p>
          <h1 className="text-2xl font-medium tracking-tight text-foreground mb-1">Access ready</h1>
          <p className="text-muted-foreground text-sm">Your sale is confirmed</p>
        </div>

        {/* Main card */}
        <div className="border border-border rounded-2xl p-6 bg-card space-y-5">
          <p className="font-medium text-lg text-foreground leading-snug">{order.product_title}</p>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivered to</span>
              <span className="font-medium text-foreground truncate max-w-[55%] text-right">{order.buyer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sold by</span>
              <span className="font-medium text-foreground">
                {seller?.username ? (
                  <Link href={`/@${seller.username}`} className="hover:underline">
                    {seller.name || seller.username}
                  </Link>
                ) : (
                  seller?.name ?? seller?.username
                )}
              </span>
            </div>
          </div>

          <a
            href={`${appUrl}/api/orders/${order.id}/access`}
            className="flex items-center justify-center w-full px-6 py-3.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-base hover:opacity-90 transition-opacity"
          >
            Open link →
          </a>
        </div>

        {/* Order info */}
        <div className="border border-border rounded-2xl px-5 py-4 bg-card">
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Sale ID</span>
              <span className="font-mono text-foreground">#{shortId}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{purchasedOn}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount</span>
              <span className="font-medium text-foreground">${order.price_paid.toFixed(2)} {order.currency.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Contact + report */}
        <div className="flex flex-col gap-3 text-center">
          {seller?.email && (
            <a
              href={`mailto:${seller.email}?subject=${encodeURIComponent(`Question about my order: ${order.product_title}`)}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Questions? Contact seller →
            </a>
          )}
          <ReportProblem
            productId={order.product_id}
            orderId={order.id}
            reporterEmail={session.email}
          />
          <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← All orders
          </Link>
          <p className="text-xs text-muted-foreground">
            Payments &amp; refunds handled by <span className="font-medium text-foreground">Stripe</span>
          </p>
        </div>
      </div>
    </main>
  );
}
