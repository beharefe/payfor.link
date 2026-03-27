import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import Link from "next/link";
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
    .select(
      "id, title, description, slug, status, price, total_sales, total_revenue, seller_id, version, preview_image_url",
    )
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
    .eq("link_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;
  const paywallUrl = seller?.username
    ? `${appUrl}/@${seller.username}/${link.slug}`
    : `${appUrl}/pay/${link.slug}`;
  const isDeleted = link.status === "deleted";
  const isArchived = link.status === "archived";
  const isSuspended = link.status === "suspended";
  const canEdit = !isDeleted && !isSuspended;

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <p className="mb-6">
        <Link href="/dashboard">← Dashboard</Link>
      </p>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="mb-1">{link.title}</h1>
          <p className="text-muted-foreground text-sm m-0">
            <StatusBadge status={link.status} /> · ${link.price.toFixed(2)} · v
            {link.version}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/dashboard/links/${id}/edit`}
              className="px-3 py-1.5 border border-border rounded-lg text-sm no-underline text-foreground"
            >
              Edit
            </Link>
            <ArchiveButton id={id} isArchived={isArchived} />
            <DeleteButton id={id} />
          </div>
        )}
      </div>

      {link.description && (
        <p className="text-muted-foreground mb-6">
          {link.description}
        </p>
      )}

      {/* Stripe connect prompt */}
      {!seller?.stripe_connected && (
        <section className="mb-6 p-4 border border-border rounded-xl">
          <p className="mb-3">
            Connect Stripe to activate this link.
          </p>
          <InitiateStripeConnectButton />
        </section>
      )}

      {/* Paywall URL */}
      {!isDeleted && (
        <section className="mb-8 p-4 bg-background rounded-xl">
          <label className="text-[0.8125rem] text-muted-foreground block mb-1">
            Paywall URL
          </label>
          <p className="break-all mb-2 font-mono text-sm">
            {paywallUrl}
          </p>
          <div className="flex gap-2 flex-wrap">
            <CopyLinkButton url={paywallUrl} />
            <a
              href={paywallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm border border-border rounded-lg no-underline text-foreground"
            >
              Preview ↗
            </a>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="flex gap-8 mb-8 flex-wrap">
        <div>
          <p className="text-muted-foreground text-[0.8125rem] mb-1">
            Total sales
          </p>
          <p className="font-semibold text-xl m-0">
            {link.total_sales}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[0.8125rem] mb-1">
            Revenue
          </p>
          <p className="font-semibold text-xl m-0">
            ${link.total_revenue.toFixed(2)}
          </p>
        </div>
      </section>

      {/* Sales table */}
      <section>
        <h2 className="mb-4">Sales</h2>
        {!orders?.length ? (
          <p className="text-muted-foreground">No sales yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-3 py-2 font-medium text-muted-foreground">
                    Buyer
                  </th>
                  <th className="px-3 py-2 font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-3 py-2 font-medium text-muted-foreground">
                    Net
                  </th>
                  <th className="px-3 py-2 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-3 py-2 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border"
                  >
                    <td className="px-3 py-2">
                      {order.buyer_email}
                    </td>
                    <td className="px-3 py-2">
                      ${order.price_paid.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      ${(order.price_paid - order.platform_fee).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      {order.status === "paid" && (
                        <RefundButton
                          orderId={order.id}
                          buyerEmail={order.buyer_email}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: "text-green-700 dark:text-green-400",
    draft: "text-muted-foreground",
    archived: "text-muted-foreground",
    suspended: "text-destructive",
    deleted: "text-destructive",
  };
  const colorClass = colorMap[status] ?? "text-muted-foreground";
  return (
    <span className={`${colorClass} font-medium`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    paid: "text-green-700 dark:text-green-400",
    refunded: "text-muted-foreground",
    disputed: "text-destructive",
    fraud: "text-destructive",
  };
  const colorClass = colorMap[status] ?? "text-muted-foreground";
  return (
    <span className={`${colorClass} text-[0.8125rem]`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
