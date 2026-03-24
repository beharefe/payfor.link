"use server";

import { TABLES } from "@unseallink/lib/db";
import { isValidUrl } from "@unseallink/lib/product-utils";
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
    .from(TABLES.SELLERS)
    .update({ name })
    .eq("id", user.id);

  if (error) return { error: "Failed to save. Please try again." };
  return { ok: true };
}

export async function updateProfile(
  formData: FormData,
): Promise<SettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const name = formData.get("name")?.toString()?.trim();
  const bio = formData.get("bio")?.toString()?.trim() ?? null;
  const avatar_url = formData.get("avatar_url")?.toString()?.trim() || null;

  if (!name) return { error: "Name is required" };
  if (name.length > 60) return { error: "Name must be 60 characters or less" };
  if (bio && bio.length > 300)
    return { error: "Bio must be 300 characters or less" };
  if (avatar_url && !isValidUrl(avatar_url))
    return { error: "Invalid avatar URL" };

  const { error } = await supabase
    .from(TABLES.SELLERS)
    .update({ name, bio, avatar_url })
    .eq("id", user.id);

  if (error) return { error: "Failed to save. Please try again." };
  return { ok: true };
}
