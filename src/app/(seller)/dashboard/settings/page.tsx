import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  return (
    <main style={{ padding: "2rem", maxWidth: "28rem", margin: "0 auto" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <h1 style={{ marginBottom: "0.25rem" }}>Settings</h1>
      <p style={{ color: "#6B6B6B", marginBottom: "2rem" }}>{seller?.email}</p>
      <SettingsForm currentName={seller?.name ?? ""} />
    </main>
  );
}
