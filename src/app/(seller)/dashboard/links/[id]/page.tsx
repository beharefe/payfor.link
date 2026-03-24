import { createClient } from "@unseallink/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InitiateStripeConnectButton } from "../../dashboard-actions";
import { CopyLinkButton } from "./copy-link-button";
import { ArchiveButton, DeleteButton, RefundButton } from "./link-actions";
import { TABLES } from "@unseallink/lib/db";

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
    .select("stripe_connected")
    .eq("id", user.id)
    .single();

  const { data: orders } = await supabase
    .from(TABLES.ORDERS)
    .select("id, buyer_email, price_paid, platform_fee, status, created_at")
    .eq("link_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paywallUrl = `${appUrl}/pay/${link.slug}`;
  const isDeleted = link.status === "deleted";
  const isArchived = link.status === "archived";
  const isSuspended = link.status === "suspended";
  const canEdit = !isDeleted && !isSuspended;

  return (
    <main style={{ padding: "2rem", maxWidth: "48rem", margin: "0 auto" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        <Link href="/dashboard">← Dashboard</Link>
      </p>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>{link.title}</h1>
          <p style={{ color: "#6B6B6B", fontSize: "0.9rem", margin: 0 }}>
            <StatusBadge status={link.status} /> · ${link.price.toFixed(2)} · v{link.version}
          </p>
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link
              href={`/dashboard/links/${id}/edit`}
              style={{
                padding: "0.4rem 0.75rem",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                fontSize: "0.9rem",
                textDecoration: "none",
                color: "#111",
              }}
            >
              Edit
            </Link>
            <ArchiveButton id={id} isArchived={isArchived} />
            <DeleteButton id={id} />
          </div>
        )}
      </div>

      {link.description && (
        <p style={{ color: "#6B6B6B", marginBottom: "1.5rem" }}>{link.description}</p>
      )}

      {/* Stripe connect prompt */}
      {!seller?.stripe_connected && (
        <section style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #E5E5E5", borderRadius: "12px" }}>
          <p style={{ margin: "0 0 0.75rem" }}>Connect Stripe to activate this link.</p>
          <InitiateStripeConnectButton />
        </section>
      )}

      {/* Paywall URL */}
      {!isDeleted && (
        <section style={{ marginBottom: "2rem", padding: "1rem", background: "#F5F4EF", borderRadius: "12px" }}>
          <label style={{ fontSize: "0.8125rem", color: "#6B6B6B", display: "block", marginBottom: "0.25rem" }}>
            Paywall URL
          </label>
          <p style={{ wordBreak: "break-all", margin: "0 0 0.5rem", fontFamily: "monospace", fontSize: "0.9rem" }}>
            {paywallUrl}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <CopyLinkButton url={paywallUrl} />
            <a href={paywallUrl} target="_blank" rel="noopener noreferrer"
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", border: "1px solid #E5E5E5", borderRadius: "8px", textDecoration: "none", color: "#111" }}>
              Preview ↗
            </a>
          </div>
        </section>
      )}

      {/* Stats */}
      <section style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ color: "#6B6B6B", fontSize: "0.8125rem", margin: "0 0 0.25rem" }}>Total sales</p>
          <p style={{ fontWeight: 600, fontSize: "1.25rem", margin: 0 }}>{link.total_sales}</p>
        </div>
        <div>
          <p style={{ color: "#6B6B6B", fontSize: "0.8125rem", margin: "0 0 0.25rem" }}>Revenue</p>
          <p style={{ fontWeight: 600, fontSize: "1.25rem", margin: 0 }}>${link.total_revenue.toFixed(2)}</p>
        </div>
      </section>

      {/* Sales table */}
      <section>
        <h2 style={{ marginBottom: "1rem" }}>Sales</h2>
        {!orders?.length ? (
          <p style={{ color: "#6B6B6B" }}>No sales yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E5E5", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500, color: "#6B6B6B" }}>Buyer</th>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500, color: "#6B6B6B" }}>Amount</th>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500, color: "#6B6B6B" }}>Net</th>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500, color: "#6B6B6B" }}>Status</th>
                  <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500, color: "#6B6B6B" }}>Date</th>
                  <th style={{ padding: "0.5rem 0.75rem" }} />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid #F5F4EF" }}>
                    <td style={{ padding: "0.5rem 0.75rem" }}>{order.buyer_email}</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>${order.price_paid.toFixed(2)}</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      ${(order.price_paid - order.platform_fee).toFixed(2)}
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem", color: "#6B6B6B" }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      {order.status === "paid" && (
                        <RefundButton orderId={order.id} buyerEmail={order.buyer_email} />
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
  const colors: Record<string, string> = {
    active: "#1A7A4A",
    draft: "#6B6B6B",
    archived: "#6B6B6B",
    suspended: "#C0392B",
    deleted: "#C0392B",
  };
  return (
    <span style={{ color: colors[status] ?? "#6B6B6B", fontWeight: 500 }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "#1A7A4A",
    refunded: "#6B6B6B",
    disputed: "#C0392B",
    fraud: "#C0392B",
  };
  return (
    <span style={{ color: colors[status] ?? "#6B6B6B", fontSize: "0.8125rem" }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
