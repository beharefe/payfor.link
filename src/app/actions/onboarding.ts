"use server";

import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

// 3–30 chars, starts/ends with alphanumeric, allows _ and - in the middle
const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$|^[a-z0-9]{1,3}$/;

export async function saveOnboardingName(formData: FormData) {
  const name = formData.get("name")?.toString()?.trim();
  const rawUsername = formData.get("username")?.toString()?.trim()?.toLowerCase();

  if (!name) redirect("/onboarding/name?error=name_required");

  const username = rawUsername ?? "";
  if (!username || !USERNAME_RE.test(username)) {
    redirect("/onboarding/name?error=username_invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Check username uniqueness against other sellers
  const { data: existing } = await supabase
    .from(TABLES.SELLERS)
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    redirect("/onboarding/name?error=username_taken");
  }

  await supabase
    .from(TABLES.SELLERS)
    .update({ name: name.slice(0, 60), username })
    .eq("id", user.id);

  redirect("/dashboard");
}
