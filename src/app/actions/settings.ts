"use server";

import { TABLES } from "@unseallink/lib/db";
import { isValidUrl } from "@unseallink/lib/product-utils";
import { createClient, createServiceClient } from "@unseallink/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  // Case-insensitive uniqueness check — use service client because RLS only allows reading own row
  const service = createServiceClient();
  const { data: existing } = await service
    .from(TABLES.SELLERS)
    .select("id")
    .ilike("name", name)
    .neq("id", user.id)
    .maybeSingle();
  if (existing) return { error: "That display name is already taken. Try another." };

  const { error } = await supabase
    .from(TABLES.SELLERS)
    .update({ name })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "That display name is already taken. Try another." };
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath("/dashboard", "layout");
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

  const rawTwitter = formData.get("twitter_handle")?.toString()?.trim() ?? null;
  const twitter_handle = rawTwitter ? rawTwitter.replace(/^@+/, "").slice(0, 50) || null : null;

  const rawWebsite = formData.get("website_url")?.toString()?.trim() || null;
  if (rawWebsite && !rawWebsite.startsWith("https://"))
    return { error: "Website URL must start with https://" };
  const website_url = rawWebsite || null;

  const profile_public = formData.get("profile_public") !== "false";

  if (!name) return { error: "Name is required" };
  if (name.length > 60) return { error: "Name must be 60 characters or less" };
  if (bio && bio.length > 300)
    return { error: "Bio must be 300 characters or less" };
  if (avatar_url && !isValidUrl(avatar_url))
    return { error: "Invalid avatar URL" };

  // Case-insensitive uniqueness check — use service client because RLS only allows reading own row
  const service = createServiceClient();
  const { data: existing } = await service
    .from(TABLES.SELLERS)
    .select("id")
    .ilike("name", name)
    .neq("id", user.id)
    .maybeSingle();
  if (existing) return { error: "That display name is already taken. Try another." };

  const { error } = await supabase
    .from(TABLES.SELLERS)
    .update({ name, bio, avatar_url, twitter_handle, website_url, profile_public })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "That display name is already taken. Try another." };
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// Solana wallet address: base58, 32–44 chars, no special characters.
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function saveSolanaWallet(
  formData: FormData,
): Promise<SettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const raw = formData.get("solana_wallet_address")?.toString()?.trim() ?? "";
  const solana_wallet_address = raw || null;

  if (solana_wallet_address !== null && !SOLANA_ADDRESS_RE.test(solana_wallet_address)) {
    return { error: "Invalid Solana address. Must be 32–44 base58 characters." };
  }

  // Guard: seller must have completed Stripe KYC before enabling crypto payments.
  // This ensures identity verification regardless of payment method.
  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("stripe_charges_enabled")
    .eq("id", user.id)
    .single();

  if (!seller?.stripe_charges_enabled) {
    return { error: "Complete Stripe setup before enabling crypto payments." };
  }

  const { error } = await supabase
    .from(TABLES.SELLERS)
    .update({ solana_wallet_address })
    .eq("id", user.id);

  if (error) return { error: "Failed to save. Please try again." };

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
