import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { InitiateStripeConnectButton } from "../../dashboard-actions";
import { CopyLinkButton } from "./copy-link-button";
import { ArchiveButton, DeleteButton, RefundButton } from "./link-actions";

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, title, description, slug, status, price, total_sales, total_revenue, seller_id, version, preview_image_url, max_orders")
    .eq("id", id)
    .single();

  if (!link || link.seller_id !== user.id) notFound();

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("stripe_connected, username")
    .eq("id", user.id)
    .single();

  const { data: orders } = await supabase
    .from(TABLES.ORDERS)
    .select("id, buyer_email, price_paid, platform_fee, status, created_at")
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;
  const paywallUrl = seller?.username
    ? `${appUrl}/@${seller.username}/${link.slug}`
    : null;

  const isDeleted   = link.status === "deleted";
  const isArchived  = link.status === "archived";
  const isSuspended = link.status === "suspended";
  const isSoldOut   = link.max_orders !== null && link.total_sales >= link.max_orders;
  const canEdit     = !isDeleted && !isSuspended;

  const effectiveStatus = isSoldOut ? "sold_out" : link.status;

  const statusStyles: Record<string, string> = {
    active:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    draft:     "bg-muted text-muted-foreground",
    archived:  "bg-muted text-muted-foreground",
    suspended: "bg-destructive/10 text-destructive",
    deleted:   "bg-destructive/10 text-destructive",
    sold_out:  "bg-muted text-muted-foreground",
  };

  return (
    <main>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Top row: back link + actions */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard/links"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            ← Links
          </Link>
          {canEdit && (
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/dashboard/links/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground no-underline hover:bg-muted transition-colors"
              >
                Edit
              </Link>
              <ArchiveButton id={id} isArchived={isArchived} />
              <DeleteButton id={id} />
            </div>
          )}
        </div>

        {/* Title + status + description */}
        <div className="space-y-3">
          <h1 className="text-2xl font-medium tracking-tight text-foreground leading-snug">
            {link.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[effectiveStatus] ?? statusStyles.draft}`}>
              {effectiveStatus === "sold_out"
                ? "Sold out"
                : effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
            </span>
            <span className="text-sm font-medium text-foreground">${link.price.toFixed(2)}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground">v{link.version}</span>
          </div>
          {link.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{link.description}</p>
          )}
        </div>

        {/* Stripe connect prompt */}
        {!seller?.stripe_connected && (
          <div className="border border-border rounded-2xl p-5 bg-card flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">Connect Stripe to activate this link</p>
              <p className="text-sm text-muted-foreground">Takes about 2 minutes.</p>
            </div>
            <InitiateStripeConnectButton />
          </div>
        )}

        {/* Paywall URL — single responsive block, no mobile/desktop duplication */}
        {!isDeleted && paywallUrl && (
          <div className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Paywall URL</p>
            <p className="break-all font-mono text-sm text-foreground">{paywallUrl}</p>
            <div className="flex gap-2 flex-wrap">
              {!isSoldOut && <CopyLinkButton url={paywallUrl} price={link.price} />}
              <Link
                href={`/preview/${link.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground no-underline hover:bg-muted transition-colors"
              >
                Preview
              </Link>
              <a
                href={paywallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground no-underline hover:bg-muted transition-colors"
              >
                Open
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border rounded-2xl px-5 py-4 bg-card">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Total sales</p>
            <p className="text-2xl font-medium text-foreground tabular-nums">
              {link.max_orders !== null
                ? `${link.total_sales} / ${link.max_orders}`
                : link.total_sales}
            </p>
          </div>
          <div className="border border-border rounded-2xl px-5 py-4 bg-card">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Revenue</p>
            <p className="text-2xl font-medium text-foreground tabular-nums">
              ${link.total_revenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Sales list */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Sales</p>
          {!orders?.length ? (
            <div className="border border-dashed border-border rounded-2xl p-10 text-center">
              <p className="text-muted-foreground text-sm">No sales yet.</p>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-hidden bg-card">
              <div className="divide-y divide-border">
                {orders.map((order) => (
                  <div key={order.id} className="px-5 py-4 flex items-center gap-3">
                    {/* Email + date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{order.buyer_email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" · "}net ${(order.price_paid - order.platform_fee).toFixed(2)}
                      </p>
                    </div>
                    {/* Status + refund */}
                    <div className="flex items-center gap-2 shrink-0">
                      <OrderStatusBadge status={order.status} />
                      {order.status === "paid" && (
                        <RefundButton orderId={order.id} buyerEmail={order.buyer_email} />
                      )}
                    </div>
                    {/* Amount */}
                    <p className="text-sm font-medium text-foreground tabular-nums shrink-0">
                      ${order.price_paid.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    refunded: "bg-muted text-muted-foreground",
    disputed: "bg-destructive/10 text-destructive",
    fraud:    "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? styles.refunded}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
