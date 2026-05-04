-- Add Solana wallet to sellers (nullable — only set when seller opts in to crypto)
ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS solana_wallet_address text;

-- Validate base58 Solana address format (32–44 chars, base58 alphabet only)
ALTER TABLE sellers
  ADD CONSTRAINT sellers_solana_wallet_format
  CHECK (
    solana_wallet_address IS NULL
    OR (
      char_length(solana_wallet_address) BETWEEN 32 AND 44
      AND solana_wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]+$'
    )
  );

-- Track which processor handled each order
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_processor text NOT NULL DEFAULT 'stripe'
  CHECK (payment_processor IN ('stripe', 'helio'));

-- Helio transaction ID for webhook idempotency (crypto orders only)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS crypto_transaction_id text;

ALTER TABLE orders
  ADD CONSTRAINT orders_crypto_transaction_id_unique
  UNIQUE (crypto_transaction_id);

-- Temporary store linking Helio pay link IDs to product/buyer before the webhook fires.
-- Helio's CreatePaylinkDto has no metadata field, so we store context server-side.
-- Records expire after 1 hour; expired rows are skipped in the webhook handler.
CREATE TABLE IF NOT EXISTS pending_crypto_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helio_paylink_id text UNIQUE NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_email text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pending_crypto_checkouts_paylink_idx
  ON pending_crypto_checkouts (helio_paylink_id);

COMMENT ON TABLE pending_crypto_checkouts IS 'Ephemeral mapping: Helio paylinkId → product + buyer. Read once by the webhook handler, then the order record takes over.';
COMMENT ON COLUMN sellers.solana_wallet_address IS 'Solana wallet address for receiving crypto payments via Helio (base58, 32–44 chars). Requires stripe_charges_enabled = true before it can be set.';
COMMENT ON COLUMN orders.payment_processor IS 'stripe (default) or helio (SOL/USDC on Solana via Helio headless payments)';
COMMENT ON COLUMN orders.crypto_transaction_id IS 'Helio transaction signature or ID; UNIQUE constraint enforces idempotency for crypto orders';
