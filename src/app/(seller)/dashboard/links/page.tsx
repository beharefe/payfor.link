import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { LockKeyhole } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyLinkButtons } from "../copy-link-buttons";

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default async function LinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("username, stripe_connected")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/onboarding/name");

  const { data: links } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, title, slug, status, price, total_sales, total_revenue, expires_at")
    .eq("seller_id", user.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
          Your links
        </p>

        {!links?.length ? (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <LockKeyhole className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">No links yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Paste any URL, set a price, and share your paywall. Buyers pay via Stripe and get instant access.
              </p>
            </div>
            <Link
              href="/dashboard/links/new"
              className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Create your first link
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {links.map((link) => {
              const expired = isExpired(link.expires_at);
              const effectiveStatus = expired ? "expired" : link.status;
              return (
                <div
                  key={link.id}
                  className="border border-border rounded-2xl px-5 py-4 bg-card flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-foreground truncate">{link.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        effectiveStatus === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : effectiveStatus === "expired"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {effectiveStatus}
                      </span>
                      {link.expires_at && !expired && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0 cursor-default"
                          title={new Date(link.expires_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                        >
                          Limited
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {link.status === "draft" && !seller.stripe_connected
                        ? "Connect Stripe to activate"
                        : `${link.total_sales} sales · $${(link.total_revenue ?? 0).toFixed(2)} earned`}
                      {link.expires_at && !expired && (() => {
                        const ms = new Date(link.expires_at).getTime() - Date.now();
                        const hours = Math.floor(ms / 3600000);
                        const label = hours >= 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;
                        return <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">· expires in {label}</span>;
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {effectiveStatus === "active" && (
                      <CopyLinkButtons url={`${appUrl}/@${seller.username}/${link.slug}`} linkId={link.id} price={link.price} />
                    )}
                    <Link
                      href={`/preview/${link.id}`}
                      className="px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground no-underline hover:bg-muted transition-colors"
                    >
                      Preview
                    </Link>
                    <Link
                      href={`/dashboard/links/${link.id}`}
                      className="px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground no-underline hover:bg-muted transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
