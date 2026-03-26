"use server";

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

  // Check if base is available
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

  await supabase
    .from(TABLES.SELLERS)
    .update({ name: name.slice(0, 60), username })
    .eq("id", user.id);

  redirect("/dashboard");
}
