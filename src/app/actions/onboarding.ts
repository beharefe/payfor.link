"use server";

import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

// name doubles as URL handle: 2–30 chars, lowercase alphanumeric + _ and -
const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,28}[a-z0-9]$|^[a-z0-9]{1,2}$/;

export async function saveOnboardingName(formData: FormData) {
  const raw = formData.get("name")?.toString()?.trim()?.toLowerCase();

  if (!raw) redirect("/onboarding/name?error=name_required");

  const name = raw ?? "";
  if (!NAME_RE.test(name)) {
    redirect("/onboarding/name?error=name_invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Check name uniqueness against other sellers
  const { data: existing } = await supabase
    .from(TABLES.SELLERS)
    .select("id")
    .eq("name", name)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    redirect("/onboarding/name?error=name_taken");
  }

  await supabase
    .from(TABLES.SELLERS)
    .update({ name })
    .eq("id", user.id);

  redirect("/dashboard");
}
