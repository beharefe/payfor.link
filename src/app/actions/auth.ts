"use server";

import { sendSellerSignInEmail } from "@unseallink/lib/email";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithOtp(formData: FormData): Promise<void> {
  const email = formData.get("email")?.toString()?.trim();
  if (!email) {
    redirect(`/auth?error=${encodeURIComponent("Email is required")}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Generate the magic link server-side so we can send it via our own template
  // instead of Supabase's default email.
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${appUrl}/auth/confirm` },
  });

  if (error || !data.properties.action_link) {
    redirect(
      `/auth?error=${encodeURIComponent(error?.message ?? "Could not send sign-in link")}`,
    );
  }

  await sendSellerSignInEmail({ to: email, link: data.properties.action_link });

  redirect(`/auth?sent=1&email=${encodeURIComponent(email)}`);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
