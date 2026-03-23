import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";
import { saveOnboardingName } from "@unseallink/app/actions/onboarding";

export default async function OnboardingNamePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Already has a name — skip onboarding
  const { data: seller } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();
  if (seller?.name) redirect("/dashboard");

  return (
    <main style={{ padding: "2rem", maxWidth: "24rem", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "0 0 0.5rem" }}>
        What should buyers call you?
      </h1>
      <p style={{ color: "#6B6B6B", margin: "0 0 1.5rem" }}>
        This is shown on your paywall pages as "by [name]". You can change it later in settings.
      </p>
      <form action={saveOnboardingName} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input
          name="name"
          type="text"
          required
          autoFocus
          maxLength={60}
          placeholder="Your name or brand"
          style={{
            padding: "12px 14px",
            border: "1.5px solid #E5E5E5",
            borderRadius: "12px",
            fontSize: "1rem",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 24px",
            background: "#111111",
            color: "#ffffff",
            border: "none",
            borderRadius: "100px",
            fontWeight: 500,
            fontSize: "1rem",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          Continue →
        </button>
      </form>
    </main>
  );
}
