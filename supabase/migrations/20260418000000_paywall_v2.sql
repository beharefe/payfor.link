-- Rich content fields for paywall pages
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS includes TEXT[],
  ADD COLUMN IF NOT EXISTS faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preview_image_key TEXT;

-- Enforce subtitle max length at DB level
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_subtitle_max_length'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT product_subtitle_max_length
      CHECK (char_length(subtitle) <= 120);
  END IF;
END; $$;

-- Social links and visibility control for seller profiles
ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_public BOOLEAN NOT NULL DEFAULT true;

-- Speed up the seller profile page products listing
CREATE INDEX IF NOT EXISTS idx_products_seller_active
  ON products(seller_id, status)
  WHERE status = 'active';
