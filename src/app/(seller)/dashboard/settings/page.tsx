import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name, email, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="p-8 max-w-[28rem] mx-auto">
      <p className="mb-6">
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <h1 className="mb-1">Settings</h1>
      <p className="text-muted-foreground mb-8">{seller?.email}</p>
      <SettingsForm
        currentName={seller?.name ?? ""}
        currentBio={seller?.bio ?? ""}
        currentAvatarUrl={seller?.avatar_url ?? null}
      />
    </main>
  );
}
