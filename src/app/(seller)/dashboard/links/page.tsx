import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { ChevronRight, LockKeyhole } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyLinkButtons } from "../copy-link-buttons";

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function getEffectiveStatus(link: {
  status: string;
  expires_at: string | null;
  total_sales: number;
  max_orders: number | null;
}): string {
  if (link.max_orders !== null && link.total_sales >= link.max_orders) return "sold_out";
  if (isExpired(link.expires_at)) return "expired";
  return link.status;
}

const BADGE_CLASS: Record<string, string> = {
  active:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  expired:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  sold_out: "bg-muted text-muted-foreground",
  draft:    "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
  suspended:"bg-destructive/10 text-destructive",
};

function badgeLabel(s: string) {
  if (s === "sold_out") return "Sold out";
  return s.charAt(0).toUpperCase() + s.slice(1);
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
    .select("id, title, slug, status, price, total_sales, total_revenue, expires_at, max_orders")
    .eq("seller_id", user.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  const liveLinks = (links ?? []).filter(l => {
    const s = getEffectiveStatus(l);
    return s === "active" || s === "draft";
  });
  const pastLinks = (links ?? []).filter(l => {
    const s = getEffectiveStatus(l);
    return s !== "active" && s !== "draft";
  });

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
            <div className="text-center">
              <p className="font-medium text-foreground mb-1">Ready to sell your first link?</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-3">
                Paste your link below. Buyers pay via Stripe. You get paid directly. We take 4.5%.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Works with: Notion templates · Figma files · Google Drive · GitHub repos · Discord servers · Any URL
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
          <div className="flex flex-col gap-6">

            {/* Active / draft links */}
            {liveLinks.length > 0 && (
              <div className="flex flex-col gap-3">
                {liveLinks.map((link) => {
                  const effectiveStatus = getEffectiveStatus(link);
                  const paywallUrl = `${appUrl}/@${seller.username}/${link.slug}`;
                  return (
                    <div
                      key={link.id}
                      className="border border-border rounded-2xl bg-card overflow-hidden"
                    >
                      <Link
                        href={`/dashboard/links/${link.id}`}
                        className="flex items-center gap-3 px-4 py-4 no-underline hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-medium text-foreground truncate">{link.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${BADGE_CLASS[effectiveStatus] ?? BADGE_CLASS.draft}`}>
                              {badgeLabel(effectiveStatus)}
                            </span>
                            {link.expires_at && !isExpired(link.expires_at) && (
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
                              ? "Enable payouts to activate"
                              : `${link.total_sales} sales · $${(link.total_revenue ?? 0).toFixed(2)} earned`}
                            {link.expires_at && !isExpired(link.expires_at) && (() => {
                              const ms = new Date(link.expires_at).getTime() - Date.now();
                              const hours = Math.floor(ms / 3600000);
                              const label = hours >= 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;
                              return <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">· expires in {label}</span>;
                            })()}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-foreground shrink-0 mr-1">
                          ${link.price % 1 === 0 ? link.price.toFixed(0) : link.price.toFixed(2)}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                      </Link>

                      {effectiveStatus === "active" && (
                        <div className="border-t border-border px-4 py-3 flex items-center gap-2 flex-wrap">
                          <CopyLinkButtons url={paywallUrl} linkId={link.id} price={link.price} />
                          <Link
                            href={`/preview/${link.id}`}
                            className="px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground no-underline hover:bg-muted transition-colors"
                          >
                            Preview
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Past links — sold out, archived, expired */}
            {pastLinks.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Past links
                </p>
                {pastLinks.map((link) => {
                  const effectiveStatus = getEffectiveStatus(link);
                  return (
                    <div
                      key={link.id}
                      className="border border-border rounded-2xl bg-card overflow-hidden"
                    >
                      <Link
                        href={`/dashboard/links/${link.id}`}
                        className="flex items-center gap-3 px-4 py-4 no-underline hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-medium text-foreground truncate">{link.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${BADGE_CLASS[effectiveStatus] ?? BADGE_CLASS.draft}`}>
                              {badgeLabel(effectiveStatus)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {`${link.total_sales} sales · $${(link.total_revenue ?? 0).toFixed(2)} earned`}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-foreground shrink-0 mr-1">
                          ${link.price % 1 === 0 ? link.price.toFixed(0) : link.price.toFixed(2)}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  );
}
