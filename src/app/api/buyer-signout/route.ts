import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { protocol, host } = request.nextUrl;
  const response = NextResponse.redirect(new URL("/orders", `${protocol}//${host}`));
  response.cookies.delete("buyer_session");
  return response;
}
