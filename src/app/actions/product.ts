"use server";

import { redirect } from "next/navigation";
import slugify from "slugify";
import { createClient } from "@payforlink/lib/supabase/server";
import { log } from "@payforlink/lib/logger";
import { checkUrlSafe } from "@payforlink/lib/safe-browsing";
import { detectProductType, isValidUrl } from "@payforlink/lib/product-utils";
import type { ProductType } from "@payforlink/types/database";

const MIN_PRICE = 3;

type CreateProductInput = {
  title: string;
  description: string;
  destination_url: string;
  price: number;
  product_type?: ProductType;
};

type ActionResult = { error: string } | { id: string };

export async function createProduct(
  input: CreateProductInput,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!input.title?.trim()) return { error: "Title is required" };
  if (!input.destination_url?.trim()) return { error: "URL is required" };
  if (!isValidUrl(input.destination_url)) return { error: "URL must start with https://" };
  if (input.price < MIN_PRICE)
    return { error: `Minimum price is $${MIN_PRICE}` };

  const { safe } = await checkUrlSafe(input.destination_url);
  if (!safe) return { error: "This link was flagged. Use a different URL." };

  const detectedType = detectProductType(input.destination_url);
  const productType = input.product_type ?? detectedType ?? null;

  // Auto-generate slug from title + collision check
  const baseSlug = slugify(input.title, { lower: true, strict: true });
  let slug = baseSlug;
  let attempt = 0;

  while (true) {
    const { data: existing } = await supabase
      .from("links")
      .select("id")
      .eq("seller_id", user.id)
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  // Detect status — active immediately if Stripe already connected
  const { data: seller } = await supabase
    .from("users")
    .select("stripe_connected")
    .eq("id", user.id)
    .single();

  const status = seller?.stripe_connected ? "active" : "draft";

  const { data: link, error } = await supabase
    .from("links")
    .insert({
      seller_id: user.id,
      slug,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      destination_url: input.destination_url.trim(),
      price: input.price,
      product_type: productType,
      status,
    })
    .select("id")
    .single();

  if (error) {
    log.error("createProduct failed", {
      error: error.message,
      user_id: user.id,
    });
    return { error: "Failed to create product" };
  }

  redirect(`/studio/links/${link.id}`);
}
