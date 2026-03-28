import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { protocol, host } = request.nextUrl;
  return NextResponse.redirect(
    new URL("/dashboard?onboarding=incomplete", `${protocol}//${host}`),
  );
}
