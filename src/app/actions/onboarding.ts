"use server";

import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveOnboardingName(formData: FormData) {
  const name = formData.get("name")?.toString()?.trim();
  if (!name) redirect("/onboarding/name");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  await supabase
    .from(TABLES.SELLERS)
    .update({ name: name.slice(0, 60) })
    .eq("id", user.id);

  redirect("/dashboard");
}
