import { verifySessionValue } from "@unseallink/lib/buyer-token";
import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ClearSessionButton } from "./clear-session-button";
import { OrdersSignIn } from "./orders-sign-in";
import { PersistOrderId } from "./persist-order-id";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Your purchases · unseal.link" },
  robots: { index: false },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Order = {
  id: string;
  product_title: string;
  price_paid: number;
  currency: string;
  created_at: string;
  status: string;
  seller_id?: string;
};

function Logo() {
  return (
    <a
      href="/"
      className="text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors no-underline block text-center"
    >
      unseal.link
    </a>
  );
}

function FeaturedCard({
  order,
  sellerName,
}: {
  order: Order;
  sellerName?: string | null;
}) {
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden">
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
          Your purchase
        </p>
        <p className="font-medium text-foreground leading-snug mb-0.5">
          {order.product_title}
        </p>
        {sellerName && (
          <p className="text-sm text-muted-foreground mb-4">by {sellerName}</p>
        )}
        <div className="border-t border-border pt-4 flex flex-col gap-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount paid</span>
            <span className="font-medium text-foreground">
              ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="text-foreground">{formatDate(order.created_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order</span>
            <span className="text-foreground font-mono text-xs">#{shortId}</span>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5">
        {order.status === "refunded" ? (
          <p className="text-center text-sm text-muted-foreground py-2">
            This order was refunded
          </p>
        ) : (
          <a
            href={`/api/orders/${order.id}/access`}
            className="flex items-center justify-center w-full px-6 py-3.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-base hover:opacity-90 transition-opacity"
          >
            Open link →
          </a>
        )}
      </div>
    </div>
  );
}

function OtherOrdersAccordion({ orders }: { orders: Order[] }) {
  if (!orders.length) return null;
  return (
    <details className="group border border-border rounded-2xl bg-card overflow-hidden">
      <summary className="px-5 py-4 flex items-center justify-between cursor-pointer select-none list-none text-sm font-medium text-foreground">
        <span>
          {orders.length === 1
            ? "1 other purchase"
            : `${orders.length} other purchases`}
        </span>
        <ChevronDown className="size-4 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div className="border-t border-border divide-y divide-border">
        {orders.map((order) => (
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
                href={`/api/orders/${order.id}/access`}
                className="text-xs font-medium text-foreground hover:opacity-60 transition-opacity shrink-0 no-underline"
              >
                Open →
              </a>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string; email?: string }>;
}) {
  const { oid, email } = await searchParams;
  const supabase = createServiceClient();

  // ─── Case 1: specific order ID (from purchase email link or bookmark) ─────
  // The order UUID is non-guessable (122-bit random) — possession proves purchase.
  if (oid) {
    const { data: order } = await supabase
      .from(TABLES.ORDERS)
      .select(
        "id, product_title, price_paid, currency, created_at, status, buyer_email, seller_id",
      )
      .eq("id", oid)
      .single();

    if (!order) {
      return (
        <main className="min-h-dvh flex items-center justify-center px-6 bg-background">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Order not found.</p>
            <a href="/orders" className="text-sm text-foreground underline mt-2 block">
              View all purchases →
            </a>
          </div>
        </main>
      );
    }

    // Fetch all other orders for this buyer (email from the order itself — no session needed)
    const [{ data: otherOrders }, { data: seller }] = await Promise.all([
      supabase
        .from(TABLES.ORDERS)
        .select("id, product_title, price_paid, currency, created_at, status")
        .eq("buyer_email", order.buyer_email)
        .neq("id", oid)
        .order("created_at", { ascending: false }),
      supabase.from(TABLES.SELLERS).select("name").eq("id", order.seller_id).single(),
    ]);

    return (
      <main className="min-h-dvh bg-background">
        <PersistOrderId oid={oid} />
        <div className="max-w-sm mx-auto px-6 py-12 flex flex-col gap-5">
          <Logo />
          <FeaturedCard order={order} sellerName={seller?.name} />
          <OtherOrdersAccordion orders={otherOrders ?? []} />
          <a
            href={`/orders?email=${encodeURIComponent(order.buyer_email)}`}
            className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            All purchases for {order.buyer_email}
          </a>
          <div className="text-center">
            <ClearSessionButton />
          </div>
        </div>
      </main>
    );
  }

  // ─── Case 2: email lookup — requires valid buyer_session cookie ───────────
  if (email) {
    const normalized = email.toLowerCase().trim();

    // Security: anyone can construct ?email=victim@example.com — verify
    // the requester has a signed session token for this specific email.
    const cookieStore = await cookies();
    const session = verifySessionValue(cookieStore.get("buyer_session")?.value ?? "");
    if (!session || session.email.toLowerCase() !== normalized) {
      // No valid session for this email — fall through to the email form (Case 3)
      return (
        <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <Logo />
              <h1 className="text-3xl font-medium tracking-tight text-foreground mt-6 mb-2">
                Your purchases
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter the email you used at checkout.
              </p>
            </div>
            <OrdersSignIn />
          </div>
        </main>
      );
    }

    const { data: orders } = await supabase
      .from(TABLES.ORDERS)
      .select(
        "id, product_title, price_paid, currency, created_at, status, seller_id",
      )
      .eq("buyer_email", normalized)
      .order("created_at", { ascending: false });

    if (!orders?.length) {
      return (
        <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <Logo />
              <h1 className="text-3xl font-medium tracking-tight text-foreground mt-6 mb-2">
                No purchases found
              </h1>
              <p className="text-muted-foreground text-sm">
                Nothing for <strong>{normalized}</strong>. Check the email address you used at checkout.
              </p>
            </div>
            <OrdersSignIn />
          </div>
        </main>
      );
    }

    const [featured, ...others] = orders;

    // Fetch seller name only for the featured (most recent) order
    const { data: seller } = await supabase
      .from(TABLES.SELLERS)
      .select("name")
      .eq("id", featured.seller_id)
      .single();

    return (
      <main className="min-h-dvh bg-background">
        <div className="max-w-sm mx-auto px-6 py-12 flex flex-col gap-5">
          <Logo />
          <FeaturedCard order={featured} sellerName={seller?.name} />
          <OtherOrdersAccordion orders={others} />
          <div className="flex items-center justify-center gap-4">
            <a
              href="/orders"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              Search a different email
            </a>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <ClearSessionButton />
          </div>
        </div>
      </main>
    );
  }

  // ─── Case 3: email form ───────────────────────────────────────────────────
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo />
          <h1 className="text-3xl font-medium tracking-tight text-foreground mt-6 mb-2">
            Your purchases
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter the email you used at checkout.
          </p>
        </div>
        <OrdersSignIn />
      </div>
    </main>
  );
}

