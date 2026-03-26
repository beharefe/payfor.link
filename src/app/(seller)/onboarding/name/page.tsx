import { saveOnboardingName } from "@unseallink/app/actions/onboarding";
import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  name_required: "Display name is required.",
  username_invalid: "Username must be 3–30 characters: lowercase letters, numbers, _ and - only.",
  username_taken: "That username is already taken. Please choose another.",
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

  // Already completed onboarding — skip
  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name, username")
    .eq("id", user.id)
    .single();
  if (seller?.name && seller?.username) redirect("/dashboard");

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-medium mb-2">Set up your profile</h1>
      <p className="text-muted-foreground mb-6">
        Shown on your paywall pages. You can change it later in settings.
      </p>
      {error && ERROR_MESSAGES[error] && (
        <p className="text-destructive text-sm mb-4">{ERROR_MESSAGES[error]}</p>
      )}
      <form action={saveOnboardingName} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Display name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={60}
            defaultValue={seller?.name ?? ""}
            placeholder="Your name or brand"
            className="w-full px-4 py-2.5 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring box-border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="username">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground select-none pointer-events-none">
              @
            </span>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={30}
              defaultValue={seller?.username ?? ""}
              placeholder="yourname"
              className="w-full pl-8 pr-4 py-2.5 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring box-border"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            unseal.link/@yourname — 3–30 chars, letters, numbers, _ and -
          </p>
        </div>
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
