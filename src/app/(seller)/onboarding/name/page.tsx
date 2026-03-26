import { saveOnboardingName } from "@unseallink/app/actions/onboarding";
import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingNamePage() {
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
      <h1 className="text-2xl font-medium mb-2">
        What should buyers call you?
      </h1>
      <p className="text-muted-foreground mb-6">
        This is shown on your paywall pages as "by [name]". You can change it
        later in settings.
      </p>
      <form
        action={saveOnboardingName}
        className="flex flex-col gap-3"
      >
        <input
          name="name"
          type="text"
          required
          maxLength={60}
          placeholder="Your name or brand"
          className="w-full px-4 py-2.5 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring box-border"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-primary text-primary-foreground border-none rounded-full font-medium text-base cursor-pointer self-start hover:opacity-90 transition-opacity"
        >
          Continue →
        </button>
      </form>
    </main>
  );
}
