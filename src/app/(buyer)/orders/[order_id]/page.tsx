import { verifySessionValue } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

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
      "id, buyer_email, product_title, price_paid, currency, created_at, status, seller_id",
    )
    .eq("id", order_id)
    .single();

  if (!order) {
    return (
      <main className="p-8 text-center">
        <h1>Order not found</h1>
        <p>
          <Link href="/orders">Back to your orders</Link>
        </p>
      </main>
    );
  }

  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("buyer_session")?.value ?? "");

  if (!session || session.email.toLowerCase() !== order.buyer_email.toLowerCase()) {
    return (
      <main className="p-8 max-w-[28rem] mx-auto text-center">
        <p className="text-3xl mb-2">🔒</p>
        <h1 className="text-2xl font-medium mb-2">
          Sign in to view this order
        </h1>
        <p className="text-muted-foreground mb-6">
          Use the access link from your purchase email, or sign in at orders.
        </p>
        <Link
          href="/orders"
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
        <h1>Order refunded</h1>
        <p>{order.product_title}</p>
        <p className="text-muted-foreground">
          This order was refunded and access is no longer available.
        </p>
        <p>
          <Link href="/orders">Back to your orders</Link>
        </p>
      </main>
    );
  }

  const { data: seller } = await service
    .from(TABLES.SELLERS)
    .select("name")
    .eq("id", order.seller_id)
    .single();

  const purchasedOn = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = order.id.slice(0, 8).toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <main className="p-8 max-w-lg mx-auto text-center">
      <p className="text-3xl mb-2">✅</p>
      <h1 className="mb-1">Order confirmed</h1>
      <h2 className="font-normal text-lg mb-1">
        {order.product_title}
      </h2>
      {seller?.name && (
        <p className="text-muted-foreground mb-6">by {seller.name}</p>
      )}

      <a
        href={`${appUrl}/api/orders/${order.id}/access`}
        className="inline-block px-6 py-3 bg-primary text-primary-foreground no-underline rounded-full font-medium text-base mb-4 hover:opacity-90 transition-opacity"
      >
        Access content →
      </a>

      <hr className="border-t border-border my-6" />

      <p className="text-muted-foreground text-sm">
        Purchased on {purchasedOn} &middot; Order #{shortId}
      </p>
      <p className="mt-3">
        <Link href="/orders" className="text-muted-foreground text-sm">
          ← All orders
        </Link>
      </p>
    </main>
  );
}
