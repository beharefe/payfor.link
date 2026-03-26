import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";
import { NameForm } from "./name-form";

export default async function OnboardingNamePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name, username")
    .eq("id", user.id)
    .single();
  if (seller?.name && seller?.username) redirect("/dashboard");

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-medium mb-2">What should we call you?</h1>
      <p className="text-muted-foreground mb-6">
        Shown on your paywall pages and public profile. Use your real name, brand, or anything buyers will recognise.
      </p>
      <NameForm defaultName={seller?.name ?? ""} error={error} />
    </main>
  );
}
