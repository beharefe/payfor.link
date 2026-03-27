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
      <main className="p-8 text-center">
        <h1>Order not found</h1>
        <p><Link href="/orders">Back to your orders</Link></p>
      </main>
    );
  }

  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("buyer_session")?.value ?? "");

  if (!session || session.email.toLowerCase() !== order.buyer_email.toLowerCase()) {
    return (
      <main className="p-8 max-w-sm mx-auto text-center">
        <p className="text-3xl mb-2">🔒</p>
        <h1 className="text-2xl font-medium mb-2">Sign in to view this order</h1>
        <p className="text-muted-foreground mb-6">
          Use the access link from your purchase email, or sign in at orders.
        </p>
        <Link
          href={`/orders?oid=${order_id}`}
          className="inline-block px-5 py-2.5 bg-primary text-primary-foreground no-underline rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          Sign in →
        </Link>
      </main>
    );
  }

  if (order.status === "refunded") {
    return (
      <main className="p-8 max-w-lg mx-auto text-center">
        <p className="text-3xl mb-2">↩️</p>
        <h1 className="text-xl font-medium mb-2">Order refunded</h1>
        <p className="text-muted-foreground mb-1">{order.product_title}</p>
        <p className="text-muted-foreground text-sm mb-6">
          This order was refunded and access is no longer available.
        </p>
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← All orders
        </Link>
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
    <main className="p-8 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-3xl mb-2">✅</p>
        <h1 className="text-2xl font-medium mb-1">Access ready</h1>
        <p className="text-muted-foreground text-sm">
          Delivered instantly after payment
        </p>
      </div>

      {/* Main card */}
      <div className="border border-border rounded-2xl p-6 mb-4">
        <p className="font-semibold text-lg mb-4">{order.product_title}</p>

        <div className="flex flex-col gap-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivered to</span>
            <span className="font-medium">{order.buyer_email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sold by</span>
            <span className="font-medium">
              {seller?.username ? (
                <Link
                  href={`/s/${seller.username}`}
                  className="hover:underline"
                >
                  {seller.name || seller.username}
                </Link>
              ) : (
                seller?.name || "—"
              )}
            </span>
          </div>
        </div>

        <a
          href={`${appUrl}/api/orders/${order.id}/access`}
          className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground no-underline rounded-full font-medium text-base hover:opacity-90 transition-opacity"
        >
          Open link →
        </a>
      </div>

      {/* Contact seller */}
      {seller?.email && (
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            Questions about this purchase?
          </p>
          <a
            href={`mailto:${seller.email}?subject=${encodeURIComponent(`Question about my purchase — ${order.product_title}`)}`}
            className="text-sm font-medium hover:underline"
          >
            Contact seller
          </a>
        </div>
      )}

      {/* Order info */}
      <div className="border-t border-border pt-4 mb-4">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Order ID</span>
            <span className="font-mono">#{shortId}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>{purchasedOn}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount</span>
            <span>${order.price_paid.toFixed(2)} {order.currency.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Dispute note + report */}
      <div className="text-center text-xs text-muted-foreground mb-6 space-y-1">
        <p>
          Payments are processed by Stripe. For disputes, you may also contact
          your payment provider.
        </p>
      </div>

      <div className="text-center mb-6">
        <ReportProblem
          productId={order.product_id}
          orderId={order.id}
          reporterEmail={session.email}
        />
      </div>

      {/* Back link */}
      <div className="text-center">
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← All orders
        </Link>
      </div>
    </main>
  );
}
