import { signOutToAuth } from "@unseallink/app/actions/auth";
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

  if (process.env.UNSEAL_SHUTDOWN_MODE === "true") {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            New accounts are closed
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            unseal.link is shutting down and no longer accepts new seller accounts.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have an existing account, sign in with the email you used before.
            Contact{" "}
            <a href="mailto:support@unseal.link" className="text-foreground underline hover:no-underline">
              support@unseal.link
            </a>{" "}
            if you need help.
          </p>
          <form action={signOutToAuth} className="pt-2">
            <button
              type="submit"
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Use a different email →
            </button>
          </form>
        </div>
      </main>
    );
  }

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
        <form action={signOutToAuth} className="mt-6 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
          <button
            type="submit"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Use a different email
          </button>
        </form>
      </div>
    </main>
  );
}
