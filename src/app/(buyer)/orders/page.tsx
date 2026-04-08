import { verifySessionValue } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { OrdersSignIn } from "./orders-sign-in";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your purchases",
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
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <a href="/" className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 hover:text-foreground transition-colors no-underline block">
              unseal.link
            </a>
            <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2">
              {oid ? "Get access link" : "Your purchases"}
            </h1>
            {error === "link_expired" ? (
              <p className="text-destructive text-sm">That link has expired. Enter your email to get a new one.</p>
            ) : oid ? (
              <p className="text-muted-foreground text-sm">Enter the email you used at checkout to resend your access link.</p>
            ) : (
              <p className="text-muted-foreground text-sm">Enter the email you used at checkout.</p>
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

  return (
    <main className="min-h-dvh bg-background">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4 mb-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {session.email}
          </p>
          <a
            href="/api/buyer-signout"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline shrink-0"
          >
            Sign out →
          </a>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-foreground mb-8">Your purchases</h1>

        {!orders?.length ? (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center">
            <p className="text-muted-foreground text-sm">No purchases found for {session.email}.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-border rounded-2xl px-5 py-4 bg-card flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate mb-1">{order.product_title}</p>
                  <p className="text-muted-foreground text-sm">
                    ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()} ·{" "}
                    {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                {order.status === "refunded" ? (
                  <span className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5 shrink-0">
                    Refunded
                  </span>
                ) : (
                  <a
                    href={`${appUrl}/api/orders/${order.id}/access`}
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm whitespace-nowrap hover:opacity-90 transition-opacity shrink-0"
                  >
                    Access →
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
