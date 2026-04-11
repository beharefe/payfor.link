import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";
import { NameForm } from "./name-form";

export default async function OnboardingNamePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;
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
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
            One last thing
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2">
            What should we call you?
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Shown on your paywall pages and public profile. Use your real name,
            brand, or anything buyers will recognise.
          </p>
        </div>
        <NameForm defaultName={seller?.name ?? ""} error={error} detail={detail} />
      </div>
    </main>
  );
}
