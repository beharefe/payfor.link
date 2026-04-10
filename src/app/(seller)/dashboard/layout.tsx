import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AvatarDropdown } from "./dashboard-actions";
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
        {/* Top row: logo + avatar dropdown */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-foreground no-underline">
            unseal.link
          </Link>
          <AvatarDropdown initial={initial} avatarUrl={seller.avatar_url ?? null} />
        </div>

        {/* Tabs row: nav tabs + New link button */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3 flex items-center justify-between gap-4">
          <DashboardTabs />
          <Link
            href="/dashboard/links/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            New link
          </Link>
        </div>
      </div>

      {children}

      {/* Mobile FAB — only on small screens where the tabs-row button is hidden */}
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
