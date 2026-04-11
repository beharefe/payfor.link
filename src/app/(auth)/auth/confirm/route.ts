import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

/** Handles Magic Link callback (PKCE code exchange or token_hash). Seller-only. */
export async function GET(request: NextRequest) {
  const { searchParams, protocol, host } = request.nextUrl;
  const appUrl = `${protocol}//${host}`;

  const supabaseError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (supabaseError) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(supabaseError)}`, appUrl),
    );
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/auth?error=missing_code", appUrl));
  }

  const supabase = await createClient();
  const error = tokenHash
    ? (await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" })).error
    : (await supabase.auth.exchangeCodeForSession(code!)).error;

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, appUrl),
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth?error=no_user", appUrl));
  }

  // Check for existing sellers row — never auto-create here.
  // New sellers are created in /onboarding/name via saveOnboardingName.
  const { data: existing } = await supabase
    .from(TABLES.SELLERS)
    .select("name, username")
    .eq("id", user.id)
    .maybeSingle();

  const needsOnboarding = !existing?.name || !existing?.username;
  return NextResponse.redirect(
    new URL(needsOnboarding ? "/onboarding/name" : "/dashboard", appUrl),
  );
}
