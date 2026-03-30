"use server";

import crypto from "node:crypto";
import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { detectProductType, isValidUrl } from "@unseallink/lib/product-utils";
import { checkUrlSafe } from "@unseallink/lib/safe-browsing";
import { createClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";
import slugify from "slugify";

const MIN_PRICE = 9.99;

type CreateProductInput = {
  title: string;
  description: string;
  destination_url: string;
  price: number;
  preview_image_url?: string;
  expires_at?: string | null;
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
  if (input.title.trim().length > 200)
    return { error: "Title must be 200 characters or less" };
  if (input.description && input.description.length > 2000)
    return { error: "Description must be 2000 characters or less" };
  if (!input.destination_url?.trim()) return { error: "URL is required" };
  if (!isValidUrl(input.destination_url))
    return { error: "URL must start with https://" };
  if (input.preview_image_url && !isValidUrl(input.preview_image_url))
    return { error: "Preview image URL must start with https://" };
  if (input.price < MIN_PRICE)
    return { error: `Minimum price is $${MIN_PRICE}` };

  const { safe } = await checkUrlSafe(input.destination_url);
  if (!safe) return { error: "This link was flagged. Use a different URL." };

  const productType = detectProductType(input.destination_url);

  // Auto-generate slug: title + 4-char random hex suffix → globally unique + readable
  const baseSlug = slugify(input.title, { lower: true, strict: true });
  let slug = "";

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = crypto.randomBytes(2).toString("hex");
    const candidate = `${baseSlug}-${suffix}`;
    const { data: existing } = await supabase
      .from(TABLES.PRODUCTS)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!existing) {
      slug = candidate;
      break;
    }
  }

  if (!slug) {
    log.error("createProduct: could not generate unique slug", {
      title: input.title,
      user_id: user.id,
    });
    return { error: "Failed to generate URL. Please try again." };
  }

  // Detect status — active immediately if Stripe already connected
  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("stripe_connected")
    .eq("id", user.id)
    .single();

  const status = seller?.stripe_connected ? "active" : "draft";

  const { data: link, error } = await supabase
    .from(TABLES.PRODUCTS)
    .insert({
      seller_id: user.id,
      slug,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      destination_url: input.destination_url.trim(),
      price: input.price,
      product_type: productType,
      preview_image_url: input.preview_image_url?.trim() || null,
      expires_at: input.expires_at || null,
      status,
    })
    .select("id")
    .single();

  if (error) {
    log.error("createProduct failed", {
      error: error.message,
      code: error.code,
      user_id: user.id,
    });
    // Surface the actual error in dev so it's visible without Axiom
    const msg = process.env.NODE_ENV === "development"
      ? `Failed to create product: ${error.message}`
      : "Failed to create product. Please try again.";
    return { error: msg };
  }

  redirect(`/dashboard/links/${link.id}`);
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
    preview_image_url: formData.get("preview_image_url")?.toString() || undefined,
    expires_at: formData.get("expires_at")?.toString() || null,
  });
  if ("error" in result) return result.error;
  return null; // createProduct redirects on success
}

type UpdateProductInput = {
  id: string;
  title: string;
  description: string;
  destination_url: string;
  price: number;
  preview_image_url?: string;
  expires_at?: string | null;
};

export async function updateProduct(
  input: UpdateProductInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!input.title?.trim()) return { error: "Title is required" };
  if (input.title.trim().length > 200)
    return { error: "Title must be 200 characters or less" };
  if (input.description && input.description.length > 2000)
    return { error: "Description must be 2000 characters or less" };
  if (!input.destination_url?.trim()) return { error: "URL is required" };
  if (!isValidUrl(input.destination_url))
    return { error: "URL must start with https://" };
  if (input.preview_image_url && !isValidUrl(input.preview_image_url))
    return { error: "Preview image URL must start with https://" };
  if (input.price < MIN_PRICE)
    return { error: `Minimum price is $${MIN_PRICE}` };

  // Verify ownership
  const { data: existing } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, seller_id, status")
    .eq("id", input.id)
    .single();
  if (!existing || existing.seller_id !== user.id)
    return { error: "Not found" };
  if (existing.status === "deleted" || existing.status === "suspended")
    return { error: "Cannot edit this link" };

  const { safe } = await checkUrlSafe(input.destination_url);
  if (!safe) return { error: "This link was flagged. Use a different URL." };

  const productType = detectProductType(input.destination_url);

  const { error } = await supabase
    .from(TABLES.PRODUCTS)
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      destination_url: input.destination_url.trim(),
      price: input.price,
      product_type: productType,
      preview_image_url: input.preview_image_url?.trim() || null,
      expires_at: input.expires_at || null,
    })
    .eq("id", input.id)
    .eq("seller_id", user.id);

  if (error) {
    log.error("updateProduct failed", {
      error: error.message,
      product_id: input.id,
      user_id: user.id,
    });
    return { error: "Failed to update product" };
  }

  redirect(`/dashboard/links/${input.id}`);
}

export async function updateProductAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const price = Number(formData.get("price"));
  const result = await updateProduct({
    id: formData.get("id")?.toString() ?? "",
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    destination_url: formData.get("destination_url")?.toString() ?? "",
    price: Number.isFinite(price) ? price : MIN_PRICE,
    preview_image_url: formData.get("preview_image_url")?.toString() || undefined,
    expires_at: formData.get("expires_at")?.toString() || null,
  });
  if ("error" in result) return result.error;
  return null;
}

export async function archiveProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, seller_id, status")
    .eq("id", id)
    .single();
  if (!existing || existing.seller_id !== user.id)
    return { error: "Not found" };
  if (existing.status === "deleted" || existing.status === "suspended")
    return { error: "Cannot archive this link" };

  let newStatus: string;
  if (existing.status === "archived") {
    // Restore to active only if Stripe is connected; otherwise draft
    const { data: seller } = await supabase
      .from(TABLES.SELLERS)
      .select("stripe_connected")
      .eq("id", user.id)
      .single();
    newStatus = seller?.stripe_connected ? "active" : "draft";
  } else {
    newStatus = "archived";
  }

  const { error } = await supabase
    .from(TABLES.PRODUCTS)
    .update({ status: newStatus })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    log.error("archiveProduct failed", {
      error: error.message,
      product_id: id,
      user_id: user.id,
    });
    return { error: "Failed to update link" };
  }

  redirect(`/dashboard/links/${id}`);
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, seller_id, status")
    .eq("id", id)
    .single();
  if (!existing || existing.seller_id !== user.id)
    return { error: "Not found" };
  if (existing.status === "suspended")
    return { error: "Cannot delete a suspended link" };

  const { error } = await supabase
    .from(TABLES.PRODUCTS)
    .update({ status: "deleted" })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    log.error("deleteProduct failed", {
      error: error.message,
      product_id: id,
      user_id: user.id,
    });
    return { error: "Failed to delete link" };
  }

  redirect("/dashboard");
}
