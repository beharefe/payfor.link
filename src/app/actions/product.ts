"use server";

import { trackServer } from "@unseallink/lib/amplitude-server";
import { createAttestation } from "@unseallink/lib/attestations";
import { TABLES } from "@unseallink/lib/db";
import { sendAdminProductPausedEmail } from "@unseallink/lib/email";
import { pingIndexNow } from "@unseallink/lib/indexnow";
import { log } from "@unseallink/lib/logger";
import { detectProductType, isValidUrl } from "@unseallink/lib/product-utils";
import { checkUrlSafe } from "@unseallink/lib/safe-browsing";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { generateSlug } from "@unseallink/lib/slugify";
import { createClient } from "@unseallink/lib/supabase/server";
import { analyzeDestinationUrl } from "@unseallink/lib/url-hygiene";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const MIN_PRICE = 9.99;
const ASCII_ONLY = /[^ -~]/;

function parseJsonArray<T>(raw: FormDataEntryValue | null): T[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw.toString());
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function asciiError(field: string): { error: string } {
  return { error: `${field} can only contain standard letters, numbers, and punctuation.` };
}

type CreateProductInput = {
  title: string;
  description: string;
  destination_url: string;
  price: number;
  preview_image_url?: string;
  expires_at?: string | null;
  max_orders?: number | null;
  terms_accepted: boolean;
  attested: boolean;
  subtitle?: string | null;
  includes?: string[] | null;
  faq?: Array<{ q: string; a: string }> | null;
  preview_image_key?: string | null;
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

  if (!input.attested)
    return { error: "Please review and confirm the product attestation." };

  if (!input.title?.trim()) return { error: "Title is required" };
  // URL hygiene runs before the expensive slug/Stripe checks
  if (input.title.trim().length > 200) return { error: "Title must be 200 characters or less" };
  if (ASCII_ONLY.test(input.title)) return asciiError("Title");
  if (input.description && input.description.length > 2000) return { error: "Description must be 2000 characters or less" };
  if (input.description && ASCII_ONLY.test(input.description)) return asciiError("Description");
  if (!input.destination_url?.trim()) return { error: "URL is required" };
  if (!isValidUrl(input.destination_url)) return { error: "URL must start with https://" };
  if (input.preview_image_url && !isValidUrl(input.preview_image_url)) return { error: "Preview image URL must start with https://" };
  if (input.price < MIN_PRICE) return { error: `Minimum price is $${MIN_PRICE}` };
  if (!input.terms_accepted) return { error: "You must accept the terms before publishing." };
  if (input.subtitle && input.subtitle.length > 120) return { error: "Tagline must be 120 characters or less" };
  if (input.subtitle && ASCII_ONLY.test(input.subtitle)) return asciiError("Tagline");
  if (input.includes && input.includes.length > 8) return { error: "Includes list must have 8 items or fewer" };
  if (input.includes?.some(s => ASCII_ONLY.test(s))) return asciiError("Includes");
  if (input.faq && input.faq.length > 5) return { error: "FAQ must have 5 items or fewer" };
  if (input.faq?.some(item => ASCII_ONLY.test(item.q) || ASCII_ONLY.test(item.a))) return asciiError("FAQ");

  const hygiene = analyzeDestinationUrl(input.destination_url);
  if (hygiene.blocked) {
    const reason = hygiene.risk_reasons.includes("recursive_paywall")
      ? "This link points to unseal.link itself, which is not allowed."
      : "This link uses a protocol or domain that is not allowed.";
    return { error: reason };
  }

  const { safe } = await checkUrlSafe(input.destination_url);
  if (!safe) return { error: "This link was flagged. Use a different URL." };

  const productType = detectProductType(input.destination_url);

  // Auto-generate slug with 4-char random suffix, retry on collision
  let slug = "";

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateSlug(input.title);
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
    .select("stripe_connected, username")
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
      max_orders: input.max_orders ?? null,
      terms_accepted_at: new Date().toISOString(),
      status: hygiene.risk_level === "medium" && status === "active" ? "paused_link_review" : status,
      subtitle: input.subtitle?.trim() || null,
      includes: input.includes?.length ? input.includes : [],
      faq: input.faq?.length ? input.faq : [],
      preview_image_key: input.preview_image_key?.trim() || null,
      destination_host: hygiene.host,
      destination_platform: hygiene.platform,
      destination_risk_level: hygiene.risk_level,
      destination_risk_reasons: hygiene.risk_reasons.length ? hygiene.risk_reasons : null,
    })
    .select("id")
    .single();

  if (error) {
    log.error("createProduct failed", {
      error: error.message,
      code: error.code,
      user_id: user.id,
    });
    const msg = process.env.NODE_ENV === "development"
      ? `Failed to create product: ${error.message}`
      : "Failed to create product. Please try again.";
    return { error: msg };
  }

  // Record attestation — non-blocking, failure logged but does not abort publish
  void createAttestation({
    seller_id: user.id,
    product_id: link.id,
    attestation_type: "publish_product",
    product_title_snapshot: input.title.trim(),
    destination_url: input.destination_url.trim(),
  });

  void trackServer(
    {
      name: "Link Created",
      props: {
        link_id: link.id,
        content_type: productType ?? "other",
        unlock_method: "otp_email",
        price: input.price,
        currency: "usd",
      },
    },
    user.id,
  );

  if (status === "active" && seller?.username) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
    void pingIndexNow([`${appUrl}/@${seller.username}/${slug}`]);
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
    max_orders: formData.get("max_orders") === "1" ? 1 : null,
    terms_accepted: formData.get("terms_accepted") === "true",
    subtitle: formData.get("subtitle")?.toString() || null,
    includes: parseJsonArray<string>(formData.get("includes")),
    faq: parseJsonArray<{ q: string; a: string }>(formData.get("faq")),
    attested: formData.get("attested") === "true",
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
  subtitle?: string | null;
  includes?: string[] | null;
  faq?: Array<{ q: string; a: string }> | null;
  preview_image_key?: string | null;
  attested?: boolean;
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
  if (input.title.trim().length > 200) return { error: "Title must be 200 characters or less" };
  if (ASCII_ONLY.test(input.title)) return asciiError("Title");
  if (input.description && input.description.length > 2000) return { error: "Description must be 2000 characters or less" };
  if (input.description && ASCII_ONLY.test(input.description)) return asciiError("Description");
  if (!input.destination_url?.trim()) return { error: "URL is required" };
  if (!isValidUrl(input.destination_url)) return { error: "URL must start with https://" };
  if (input.preview_image_url && !isValidUrl(input.preview_image_url)) return { error: "Preview image URL must start with https://" };
  if (input.price < MIN_PRICE) return { error: `Minimum price is $${MIN_PRICE}` };
  if (input.subtitle && input.subtitle.length > 120) return { error: "Tagline must be 120 characters or less" };
  if (input.subtitle && ASCII_ONLY.test(input.subtitle)) return asciiError("Tagline");
  if (input.includes && input.includes.length > 8) return { error: "Includes list must have 8 items or fewer" };
  if (input.includes?.some(s => ASCII_ONLY.test(s))) return asciiError("Includes");
  if (input.faq && input.faq.length > 5) return { error: "FAQ must have 5 items or fewer" };
  if (input.faq?.some(item => ASCII_ONLY.test(item.q) || ASCII_ONLY.test(item.a))) return asciiError("FAQ");

  // Fetch current state — needed for destination change detection and sales check
  const { data: existing } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, seller_id, status, destination_url, total_sales")
    .eq("id", input.id)
    .single();
  if (!existing || existing.seller_id !== user.id)
    return { error: "Not found" };
  if (existing.status === "deleted" || existing.status === "suspended")
    return { error: "Cannot edit this link" };

  const newUrl = input.destination_url.trim();
  const urlChanged = newUrl !== existing.destination_url;

  // Require attestation any time the access URL changes
  if (urlChanged && !input.attested) {
    return { error: "Please review and confirm before changing the access link." };
  }

  // Run URL hygiene when URL changes (or always, to backfill metadata on other edits)
  const hygiene = analyzeDestinationUrl(newUrl);
  if (hygiene.blocked) {
    const reason = hygiene.risk_reasons.includes("recursive_paywall")
      ? "This link points to unseal.link itself, which is not allowed."
      : "This link uses a protocol or domain that is not allowed.";
    return { error: reason };
  }

  const { safe } = await checkUrlSafe(newUrl);
  if (!safe) return { error: "This link was flagged. Use a different URL." };

  const productType = detectProductType(newUrl);

  // Pause when URL changes with existing sales, or URL is medium risk with sales
  const hasSales = (existing.total_sales ?? 0) > 0;
  const shouldPause =
    urlChanged && (hasSales || hygiene.risk_level === "medium");
  const newStatus = shouldPause ? "paused_link_review" : existing.status;
  const enteringPause =
    newStatus === "paused_link_review" && existing.status !== "paused_link_review";

  const { error } = await supabase
    .from(TABLES.PRODUCTS)
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      destination_url: newUrl,
      price: input.price,
      product_type: productType,
      preview_image_url: input.preview_image_url?.trim() || null,
      expires_at: input.expires_at || null,
      subtitle: input.subtitle?.trim() || null,
      includes: input.includes?.length ? input.includes : [],
      faq: input.faq?.length ? input.faq : [],
      preview_image_key: input.preview_image_key?.trim() || null,
      destination_host: hygiene.host,
      destination_platform: hygiene.platform,
      destination_risk_level: hygiene.risk_level,
      destination_risk_reasons: hygiene.risk_reasons.length ? hygiene.risk_reasons : null,
      ...(newStatus !== existing.status ? { status: newStatus } : {}),
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

  if (urlChanged) {
    void createAttestation({
      seller_id: user.id,
      product_id: input.id,
      attestation_type: "update_destination_url",
      product_title_snapshot: input.title.trim(),
      destination_url: newUrl,
    });
  }

  // Notify admin exactly once when product newly enters paused_link_review
  if (enteringPause) {
    void (async () => {
      try {
        // Fetch seller email for admin context
        const db = createServiceClient();
        const { data: seller } = await db
          .from(TABLES.SELLERS)
          .select("email")
          .eq("id", user.id)
          .maybeSingle();

        // Dedupe: insert with unique key — silently skip if already notified
        const dedupeKey = `product:${input.id}:paused_link_review`;
        const { error: notifError } = await db
          .from(TABLES.ADMIN_NOTIFICATIONS)
          .insert({
            type: "product_paused_link_review",
            product_id: input.id,
            seller_id: user.id,
            sent_to: process.env.ADMIN_REVIEW_EMAIL ?? "info@unseal.link",
            dedupe_key: dedupeKey,
            metadata: {
              previous_status: existing.status,
              destination_host: hygiene.host,
              risk_level: hygiene.risk_level,
            },
          });

        // notifError with unique violation = already sent, skip email
        if (notifError) {
          if (notifError.code === "23505") return; // unique_violation
          log.error("admin_notification insert failed", { error: notifError.message, product_id: input.id });
        }

        const h = await headers();
        const host = h.get("host") ?? "unseal.link";
        const proto = h.get("x-forwarded-proto") ?? "https";
        const crypto = await import("node:crypto");

        await sendAdminProductPausedEmail({
          productId: input.id,
          productTitle: input.title.trim(),
          sellerId: user.id,
          sellerEmail: seller?.email ?? null,
          previousStatus: existing.status,
          destinationHost: hygiene.host,
          destinationPlatform: hygiene.platform,
          destinationRiskLevel: hygiene.risk_level,
          destinationRiskReasons: hygiene.risk_reasons,
          destinationUrlHash: crypto.createHash("sha256").update(newUrl).digest("hex"),
          totalSales: existing.total_sales ?? 0,
          appUrl: `${proto}://${host}`,
        });
      } catch (err) {
        log.error("admin_product_paused_email failed", {
          error: err instanceof Error ? err.message : String(err),
          product_id: input.id,
        });
      }
    })();
  }

  void trackServer(
    {
      name: "Link Settings Updated",
      props: {
        link_id: input.id,
        changed_fields: ["title", "price", "description", "destination_url"],
        destination_url_changed: urlChanged,
        paused_for_review: newStatus === "paused_link_review",
      },
    },
    user.id,
  );

  if (newStatus === "paused_link_review") {
    redirect(`/dashboard/links/${input.id}?link_paused=1`);
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
    subtitle: formData.get("subtitle")?.toString() || null,
    includes: parseJsonArray<string>(formData.get("includes")),
    faq: parseJsonArray<{ q: string; a: string }>(formData.get("faq")),
    attested: formData.get("attested") === "true",
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
  if (existing.status === "paused_link_review")
    return { error: "This link is pending review and cannot be archived. Contact support." };

  let newStatus: string;
  if (existing.status === "archived") {
    // Restore to active only if Stripe is fully set up (OAuth + charges enabled)
    const { data: seller } = await supabase
      .from(TABLES.SELLERS)
      .select("stripe_connected, stripe_charges_enabled")
      .eq("id", user.id)
      .single();
    newStatus =
      seller?.stripe_connected && seller?.stripe_charges_enabled
        ? "active"
        : "draft";
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

  if (newStatus === "archived") {
    void trackServer(
      { name: "Link Revoked", props: { link_id: id, revoke_reason: "archived_by_seller" } },
      user.id,
    );
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

export async function submitToDiscover(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id, seller_id, status, public_status, title, destination_url, destination_risk_level, destination_platform, total_sales")
    .eq("id", id)
    .single();

  if (!existing || existing.seller_id !== user.id)
    return { error: "Not found" };
  if (existing.status !== "active")
    return { error: "Only active products can be submitted to Discover." };
  if (existing.destination_risk_level === "medium" || existing.destination_risk_level === "blocked")
    return { error: "This product's access link needs to be reviewed before it can be submitted to Discover." };
  if (existing.public_status === "approved")
    return { error: "This product is already listed on Discover." };
  if (existing.public_status === "pending")
    return { error: "This product is already pending review." };

  const { error } = await supabase
    .from(TABLES.PRODUCTS)
    .update({ public_status: "pending" })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    log.error("submitToDiscover failed", {
      error: error.message,
      product_id: id,
      user_id: user.id,
    });
    return { error: "Failed to submit. Please try again." };
  }

  // Record attestation — submit_public_listing type
  void createAttestation({
    seller_id: user.id,
    product_id: id,
    attestation_type: "submit_public_listing",
    product_title_snapshot: existing.title,
    destination_url: existing.destination_url,
  });

  void trackServer(
    {
      name: "Link Submitted to Discover",
      props: {
        link_id: id,
        platform: existing.destination_platform ?? null,
        risk_level: existing.destination_risk_level ?? null,
        total_sales: existing.total_sales ?? 0,
      },
    },
    user.id,
  );

  // Notify admin about new discover submission (non-blocking)
  void (async () => {
    try {
      const adminEmail = process.env.ADMIN_REVIEW_EMAIL ?? "info@unseal.link";
      const h = await headers();
      const host = h.get("host") ?? "unseal.link";
      const proto = h.get("x-forwarded-proto") ?? "https";
      const db = createServiceClient();
      const { data: seller } = await db
        .from(TABLES.SELLERS)
        .select("email")
        .eq("id", user.id)
        .maybeSingle();

      const { resend, FROM } = await import("@unseallink/lib/resend");
      await resend.emails.send({
        from: FROM,
        to: adminEmail,
        subject: `[unseal] New Discover submission: ${existing.title}`,
        html: `<p><b>Product submitted for Discover listing review.</b></p>
<ul>
<li>Title: ${existing.title}</li>
<li>Product ID: ${id}</li>
<li>Seller ID: ${user.id}</li>
<li>Seller email: ${seller?.email ?? "unknown"}</li>
<li>Platform: ${existing.destination_platform ?? "unknown"}</li>
<li>Risk level: ${existing.destination_risk_level ?? "low"}</li>
</ul>
<p><a href="${proto}://${host}/dashboard/links/${id}">Review product →</a></p>`,
      });
    } catch (err) {
      log.error("discover_submission_admin_email failed", {
        error: err instanceof Error ? err.message : String(err),
        product_id: id,
      });
    }
  })();

  redirect(`/dashboard/links/${id}?submitted=1`);
}
