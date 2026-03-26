"use server";

import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

// name = URL handle: 1–30 chars, lowercase alphanumeric + hyphens
// no leading/trailing hyphens, no consecutive hyphens
const NAME_RE = /^[a-z0-9][a-z0-9-]{0,28}[a-z0-9]$|^[a-z0-9]$/;
const CONSECUTIVE_HYPHENS = /--/;

export async function saveOnboardingName(formData: FormData) {
  const raw = formData.get("name")?.toString()?.trim()?.toLowerCase();

  if (!raw) redirect("/onboarding/name?error=name_required");

  const name = raw ?? "";
  if (!NAME_RE.test(name) || CONSECUTIVE_HYPHENS.test(name)) {
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
