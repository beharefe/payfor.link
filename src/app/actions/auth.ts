"use server";

import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithOtp(formData: FormData): Promise<void> {
  const email = formData.get("email")?.toString()?.trim();
  if (!email) {
    redirect(`/auth?error=${encodeURIComponent("Email is required")}`);
  }

  const supabase = await createClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${appUrl}/auth/confirm`,
    },
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/auth?sent=1&email=${encodeURIComponent(email)}`);
}


export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
