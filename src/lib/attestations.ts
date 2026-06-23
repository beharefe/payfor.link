import crypto from "node:crypto";
import { headers } from "next/headers";
import { TABLES } from "@unseallink/lib/db";
import { log } from "@unseallink/lib/logger";
import { createServiceClient } from "@unseallink/lib/supabase/server";

export type AttestationType =
  | "publish_product"
  | "update_destination_url"
  | "submit_public_listing"
  | "make_public"
  | "change_free_to_paid"
  | "fix_reported_access";

type CreateAttestationParams = {
  seller_id: string;
  product_id: string;
  attestation_type: AttestationType;
  product_title_snapshot?: string;
  destination_url?: string; // hashed + host extracted — full URL never stored
};

export async function createAttestation(params: CreateAttestationParams): Promise<void> {
  const supabase = createServiceClient();
  const headerStore = await headers();

  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent") ?? null;

  let destination_host_snapshot: string | null = null;
  let destination_url_hash: string | null = null;

  if (params.destination_url) {
    try {
      destination_host_snapshot = new URL(params.destination_url).hostname;
    } catch {
      // malformed URL — omit host snapshot
    }
    destination_url_hash = crypto
      .createHash("sha256")
      .update(params.destination_url)
      .digest("hex");
  }

  const { error } = await supabase.from(TABLES.SELLER_ATTESTATIONS).insert({
    seller_id: params.seller_id,
    product_id: params.product_id,
    attestation_type: params.attestation_type,
    ip_address: ip,
    user_agent: userAgent,
    product_title_snapshot: params.product_title_snapshot ?? null,
    destination_host_snapshot,
    destination_url_hash,
  });

  if (error) {
    // Non-blocking — audit failure must not break the seller's publish flow,
    // but we log it so ops can investigate missing attestation records.
    log.error("createAttestation failed", {
      error: error.message,
      seller_id: params.seller_id,
      product_id: params.product_id,
      attestation_type: params.attestation_type,
    });
  }
}
