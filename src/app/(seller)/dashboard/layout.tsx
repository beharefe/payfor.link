import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AvatarDropdown } from "./dashboard-actions";
import { DashboardTabs } from "./dashboard-tabs";
import { MobileFABMenu } from "./mobile-fab-menu";

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
          <Link
            href="/"
            className="no-underline shrink-0 text-[#3D3530] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.3px" }}
          >
            unseal.link
          </Link>
          <AvatarDropdown initial={initial} avatarUrl={seller.avatar_url ?? null} />
        </div>

        {/* Tabs row: nav tabs + New link button — desktop only */}
        <div className="hidden sm:flex max-w-5xl mx-auto px-6 pb-3 items-center justify-between gap-4">
          <DashboardTabs />
          <Link
            href="/dashboard/links/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            New link
          </Link>
        </div>
      </div>

      {children}

      {/* Mobile FAB menu — only on small screens */}
      <MobileFABMenu />
    </div>
  );
}
