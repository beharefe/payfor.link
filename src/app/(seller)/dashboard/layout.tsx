import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "./dashboard-actions";
import { DashboardTabs } from "./dashboard-tabs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/onboarding/name");

  const initial = seller.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="min-h-dvh bg-background">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-foreground no-underline">
            unseal.link
          </Link>
          <div className="flex items-center gap-3">
            {/* Desktop: always-visible create button */}
            <Link
              href="/dashboard/links/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              New link
            </Link>
            <SignOutButton />
            {seller.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller.name ?? ""}
                className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium text-foreground shrink-0">
                {initial}
              </div>
            )}
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4">
          <DashboardTabs />
        </div>
      </div>
      {children}

      {/* Mobile FAB — fixed bottom-right, hidden on sm+ where the header button is shown */}
      <Link
        href="/dashboard/links/new"
        aria-label="Create new link"
        className="sm:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl hover:opacity-90 transition-opacity no-underline"
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </Link>
    </div>
  );
}
