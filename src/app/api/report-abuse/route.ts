import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_REASONS = ["scam", "malware", "copyright", "other"] as const;

export async function POST(request: Request) {
  let body: { product_id?: string; reason?: string; description?: string; reporter_email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { product_id, reason, description, reporter_email } = body;

  if (!product_id || typeof product_id !== "string") {
    return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
  }

  if (
    !reason ||
    !VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])
  ) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify product exists
  const { data: product } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id")
    .eq("id", product_id)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const trimmedDescription = description?.trim() || null;
  if (trimmedDescription && trimmedDescription.length > 500) {
    return NextResponse.json(
      { error: "Description must be 500 characters or less" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from(TABLES.REPORTS).insert({
    product_id,
    reason,
    description: trimmedDescription,
    reporter_email: reporter_email?.trim().toLowerCase() || null,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
