import { verifySessionValue } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { OrdersSignIn } from "./orders-sign-in";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false },
};

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
      <main className="p-8 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-medium mb-2">
          Your orders
        </h1>
        {error === "link_expired" && (
          <p className="text-destructive mb-4 text-sm">
            That link has expired. Enter your email to get a new one.
          </p>
        )}
        <p className="text-muted-foreground mb-8">
          Enter the email you used at checkout to access your orders.
        </p>
        <OrdersSignIn oid={oid} />
      </main>
    );
  }

  const service = createServiceClient();
  const { data: orders } = await service
    .from(TABLES.ORDERS)
    .select("id, product_title, price_paid, currency, created_at, status")
    .eq("buyer_email", session.email)
    .order("created_at", { ascending: false });

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium mb-6">
        Your orders
      </h1>

      {!orders?.length ? (
        <p className="text-muted-foreground">No orders found for {session.email}.</p>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="border border-border rounded-2xl px-5 py-4 flex justify-between items-center gap-4"
            >
              <div>
                <p className="font-medium mb-1">
                  {order.product_title}
                </p>
                <p className="text-muted-foreground text-sm m-0">
                  ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()} ·{" "}
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Link
                href={`/orders/${order.id}`}
                className="px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm whitespace-nowrap hover:opacity-90 transition-opacity"
              >
                View →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
