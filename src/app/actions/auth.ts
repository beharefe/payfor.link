"use server";

import { createClient } from "@payforlink/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthResult = { error?: string };

export async function signInWithOtp(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email")?.toString()?.trim();
  if (!email) return { error: "Email is required" };

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

export async function verifySellerOtp(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email")?.toString()?.trim();
  const code = formData.get("code")?.toString()?.trim();
  if (!email || !code) return { error: "Email and code are required" };

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error) {
    const msg = error.message?.toLowerCase().includes("expired")
      ? "Code expired. Request a new one."
      : (error.message ?? "Invalid or expired code.");
    redirect(`/auth?error=${encodeURIComponent(msg)}&sent=1&email=${encodeURIComponent(email)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("users").upsert(
      { id: user.id, email: user.email ?? "", name: user.user_metadata?.name ?? null },
      { onConflict: "id" },
    );
  }

  redirect("/studio");
}

