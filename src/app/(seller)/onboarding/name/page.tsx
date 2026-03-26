import { saveOnboardingName } from "@unseallink/app/actions/onboarding";
import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  name_required: "Name is required.",
  name_invalid: "2–30 characters: lowercase letters, numbers, _ and - only.",
  name_taken: "That name is already taken. Please choose another.",
};

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

  // Already has a name — skip onboarding
  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name")
    .eq("id", user.id)
    .single();
  if (seller?.name) redirect("/dashboard");

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-medium mb-2">Pick your name</h1>
      <p className="text-muted-foreground mb-6">
        This is your handle on unseal.link — shown on paywall pages and your public profile.
      </p>
      {error && ERROR_MESSAGES[error] && (
        <p className="text-destructive text-sm mb-4">{ERROR_MESSAGES[error]}</p>
      )}
      <form action={saveOnboardingName} className="flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground select-none pointer-events-none">
            @
          </span>
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={30}
            placeholder="yourname"
            className="w-full pl-8 pr-4 py-2.5 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring box-border"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          unseal.link/@yourname — 2–30 chars, lowercase letters, numbers, _ and -
        </p>
        <button
          type="submit"
          className="px-6 py-3 bg-primary text-primary-foreground border-none rounded-full font-medium text-base cursor-pointer self-start hover:opacity-90 transition-opacity mt-1"
        >
          Continue →
        </button>
      </form>
    </main>
  );
}
