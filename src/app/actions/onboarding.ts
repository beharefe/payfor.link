"use server";

import { trackServer } from "@unseallink/lib/amplitude-server";
import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";
import slugify from "slugify";

async function generateHandle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  displayName: string,
  sellerId: string,
): Promise<string> {
  const base = slugify(displayName, { lower: true, strict: true }).slice(0, 28) || "seller";

  const { data: existing } = await supabase
    .from(TABLES.SELLERS)
    .select("username")
    .ilike("username", `${base}%`)
    .neq("id", sellerId);

  const taken = new Set((existing ?? []).map((r) => r.username));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function saveOnboardingName(formData: FormData) {
  const name = formData.get("name")?.toString()?.trim();
  if (!name || name.length < 1) redirect("/onboarding/name?error=name_required");
  if (name.length > 60) redirect("/onboarding/name?error=name_too_long");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const username = await generateHandle(supabase, name, user.id);

  // Upsert — creates the sellers row if it doesn't exist yet (new users),
  // or updates name/username if they're changing it (returning users).
  const { error: upsertError } = await supabase.from(TABLES.SELLERS).upsert(
    {
      id: user.id,
      email: user.email ?? "",
      name: name.slice(0, 60),
      username,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    // name UNIQUE violation → someone already has this display name
    if (upsertError.code === "23505" && upsertError.message?.includes("name")) {
      redirect("/onboarding/name?error=name_taken");
    }
    // Surface the raw error in dev so we can see exactly what's wrong
    const detail = encodeURIComponent(upsertError.message ?? upsertError.code ?? "unknown");
    redirect(`/onboarding/name?error=save_failed&detail=${detail}`);
  }

  void trackServer(
    { name: "Signup Completed", props: { user_id: user.id, signup_method: "magic_link" } },
    user.id,
  );

  redirect("/dashboard");
}
