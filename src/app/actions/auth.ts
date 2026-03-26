"use server";

import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithOtp(formData: FormData): Promise<void> {
  const email = formData.get("email")?.toString()?.trim();
  if (!email) {
    redirect(`/auth?error=${encodeURIComponent("Email is required")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/auth?sent=1&email=${encodeURIComponent(email)}`);
}

export async function verifySellerOtp(formData: FormData): Promise<void> {
  const email = formData.get("email")?.toString()?.trim();
  const code = formData.get("code")?.toString()?.trim();
  if (!email || !code) {
    redirect(`/auth?error=${encodeURIComponent("Email and code are required")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error) {
    const msg = error.message?.toLowerCase().includes("expired")
      ? "Code expired — request a new one."
      : (error.message ?? "Invalid code.");
    redirect(
      `/auth?error=${encodeURIComponent(msg)}&sent=1&email=${encodeURIComponent(email)}`,
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  let needsName = false;
  if (user) {
    const { data: existing } = await supabase
      .from(TABLES.SELLERS)
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    needsName = !existing?.name;

    await supabase.from(TABLES.SELLERS).upsert(
      { id: user.id, email: user.email ?? "", name: user.user_metadata?.name ?? null },
      { onConflict: "id" },
    );
  }

  redirect(needsName ? "/onboarding/name" : "/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
