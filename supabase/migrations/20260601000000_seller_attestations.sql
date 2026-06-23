-- Extend products status to include paused_link_review
-- (destination URL changed on a live product — paused until admin re-approves)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check
  CHECK (status IN ('draft', 'active', 'archived', 'suspended', 'deleted', 'paused_link_review'));

-- Seller attestations audit log
-- Stores a record every time a seller explicitly confirms product responsibility.
-- Full destination URL is never stored — only a SHA-256 hash and the hostname.
CREATE TABLE IF NOT EXISTS seller_attestations (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                uuid        NOT NULL REFERENCES sellers(id),
  product_id               uuid        NOT NULL REFERENCES products(id),
  attestation_type         text        NOT NULL CHECK (attestation_type IN (
                             'publish_product',
                             'update_destination_url',
                             'submit_public_listing',
                             'make_public',
                             'change_free_to_paid',
                             'fix_reported_access'
                           )),
  checkbox_version         text        NOT NULL DEFAULT 'seller_product_responsibility_v1',
  confirmed_at             timestamptz NOT NULL DEFAULT now(),
  ip_address               text,
  user_agent               text,
  product_title_snapshot   text,
  destination_host_snapshot text,
  destination_url_hash     text,
  metadata                 jsonb
);

CREATE INDEX IF NOT EXISTS idx_seller_attestations_lookup
  ON seller_attestations (seller_id, product_id, confirmed_at DESC);

ALTER TABLE seller_attestations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'seller_attestations' AND policyname = 'service_role_only'
  ) THEN
    CREATE POLICY "service_role_only"
      ON seller_attestations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
