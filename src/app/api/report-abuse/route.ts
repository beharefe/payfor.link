import { NextResponse } from "next/server";
import { createServiceClient } from "@unseallink/lib/supabase/server";

const VALID_REASONS = ["scam", "malware", "copyright", "other"] as const;

export async function POST(request: Request) {
  let body: { product_id?: string; reason?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { product_id, reason, description } = body;

  if (!product_id || typeof product_id !== "string") {
    return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
  }

  if (!reason || !VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify product exists
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", product_id)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { error } = await supabase.from("reports").insert({
    product_id,
    reason,
    description: description?.trim().slice(0, 500) || null,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
