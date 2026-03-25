import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

/** Handles Magic Link callback. Supports both PKCE code exchange and token_hash (per Supabase docs). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Handle Supabase error redirects (e.g. expired/invalid magic link)
  const supabaseError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (supabaseError) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(supabaseError)}`, appUrl),
    );
  }

  if (!code && !tokenHash) {
    return NextResponse.redirect(
      new URL("/auth?error=missing_code", appUrl),
    );
  }

  const supabase = await createClient();
  const error = tokenHash
    ? (await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" }))
        .error
    : (await supabase.auth.exchangeCodeForSession(code!)).error;

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, appUrl),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let needsName = false;
  if (user) {
    const { data: existing } = await supabase
      .from(TABLES.SELLERS)
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    needsName = !existing?.name;

    await supabase.from(TABLES.SELLERS).upsert(
      {
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.name ?? null,
      },
      { onConflict: "id" },
    );
  }

  return NextResponse.redirect(
    new URL(needsName ? "/onboarding/name" : "/dashboard", appUrl),
  );
}
