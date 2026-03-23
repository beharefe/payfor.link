import { NextResponse } from "next/server";
import { createServiceClient } from "@unseallink/lib/supabase/server";

const VALID_REASONS = ["scam", "malware", "copyright", "other"] as const;

export async function POST(request: Request) {
  let body: { link_id?: string; reason?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { link_id, reason, description } = body;

  if (!link_id || typeof link_id !== "string") {
    return NextResponse.json({ error: "Missing link_id" }, { status: 400 });
  }

  if (!reason || !VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify link exists
  const { data: link } = await supabase
    .from("links")
    .select("id")
    .eq("id", link_id)
    .single();

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const { error } = await supabase.from("abuse_reports").insert({
    link_id,
    reason,
    description: description?.trim().slice(0, 500) || null,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
