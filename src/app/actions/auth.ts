"use server";

import { createClient } from "@payforlink/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthResult = { error?: string };

export async function signInWithMagicLink(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email")?.toString()?.trim();
  if (!email) return { error: "Email is required" };

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/confirm`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/auth?sent=1");
}

