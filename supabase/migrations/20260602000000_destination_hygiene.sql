-- Destination URL hygiene columns on products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS destination_host         text,
  ADD COLUMN IF NOT EXISTS destination_platform     text,
  ADD COLUMN IF NOT EXISTS destination_risk_level   text CHECK (destination_risk_level IN ('low', 'medium', 'blocked')),
  ADD COLUMN IF NOT EXISTS destination_risk_reasons text[];

-- Admin notifications audit log (for deduplication and audit trail)
CREATE TABLE IF NOT EXISTS admin_notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL,
  product_id  uuid        REFERENCES products(id),
  seller_id   uuid        REFERENCES sellers(id),
  sent_to     text        NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  dedupe_key  text        UNIQUE,
  metadata    jsonb
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_dedupe
  ON admin_notifications (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_notifications' AND policyname = 'service_role_only'
  ) THEN
    CREATE POLICY "service_role_only"
      ON admin_notifications
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
