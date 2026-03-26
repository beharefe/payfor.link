"use server";

<<<<<<< HEAD
import { sendSellerSignInEmail } from "@unseallink/lib/email";
import { createServiceClient } from "@unseallink/lib/supabase/server";
=======
import { TABLES } from "@unseallink/lib/db";
>>>>>>> 84f4f8d (refactor: email templates)
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithOtp(formData: FormData): Promise<void> {
  const email = formData.get("email")?.toString()?.trim();
  if (!email) {
    redirect(`/auth?error=${encodeURIComponent("Email is required")}`);
  }

<<<<<<< HEAD
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Generate the magic link server-side so we can send it via our own template
  // instead of Supabase's default email.
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${appUrl}/auth/confirm` },
=======
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
>>>>>>> 84f4f8d (refactor: email templates)
  });

  if (error || !data.properties.action_link) {
    redirect(
      `/auth?error=${encodeURIComponent(error?.message ?? "Could not send sign-in link")}`,
    );
  }

  await sendSellerSignInEmail({ to: email, link: data.properties.action_link });

  redirect(`/auth?sent=1&email=${encodeURIComponent(email)}`);
}

<<<<<<< HEAD
=======
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

>>>>>>> 84f4f8d (refactor: email templates)
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
