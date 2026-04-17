-- Record when the seller explicitly accepted responsibility for the linked content.
-- Set server-side at product creation time — never writable by the client directly.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
