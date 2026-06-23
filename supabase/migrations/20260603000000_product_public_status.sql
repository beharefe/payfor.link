-- Public listing / discovery status for products
-- null  = not submitted (private by default)
-- pending  = seller submitted; awaiting admin review
-- approved = admin approved; visible in /discover
-- rejected = admin rejected; not visible

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS public_status text
    CHECK (public_status IN ('pending', 'approved', 'rejected'));

-- Fast lookup for discovery page query
CREATE INDEX IF NOT EXISTS idx_products_discover
  ON products (public_status, status)
  WHERE public_status = 'approved' AND status = 'active';
