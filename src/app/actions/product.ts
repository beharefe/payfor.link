"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { createClient } from "@unseallink/lib/supabase/server";
import { log } from "@unseallink/lib/logger";
import { checkUrlSafe } from "@unseallink/lib/safe-browsing";
import { detectProductType, isValidUrl } from "@unseallink/lib/product-utils";
import type { ProductType } from "@unseallink/types/database";

const MIN_PRICE = 9.99;

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

  // Auto-generate slug: title + 4-char random hex suffix → globally unique + readable
  const baseSlug = slugify(input.title, { lower: true, strict: true });
  let slug = "";

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = crypto.randomBytes(2).toString("hex");
    const candidate = `${baseSlug}-${suffix}`;
    const { data: existing } = await supabase
      .from("links")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!existing) {
      slug = candidate;
      break;
    }
  }

  if (!slug) {
    log.error("createProduct: could not generate unique slug", { title: input.title, user_id: user.id });
    return { error: "Failed to generate URL. Please try again." };
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

/** FormData-compatible wrapper for use with useActionState in Client Components. */
export async function createProductAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const price = Number(formData.get("price"));
  const result = await createProduct({
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    destination_url: formData.get("destination_url")?.toString() ?? "",
    price: Number.isFinite(price) ? price : MIN_PRICE,
    product_type: (formData.get("product_type")?.toString() || undefined) as ProductType | undefined,
  });
  if ("error" in result) return result.error;
  return null; // createProduct redirects on success
}
