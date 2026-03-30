import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
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
    </div>
  );
}
