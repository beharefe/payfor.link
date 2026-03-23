"use server";

import { createClient } from "@unseallink/lib/supabase/server";

export type SettingsResult = { error: string } | { ok: true };

export async function updateName(formData: FormData): Promise<SettingsResult> {
  const name = formData.get("name")?.toString()?.trim();
  if (!name) return { error: "Name is required" };
  if (name.length > 60) return { error: "Name must be 60 characters or less" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", user.id);

  if (error) return { error: "Failed to save. Please try again." };
  return { ok: true };
}
