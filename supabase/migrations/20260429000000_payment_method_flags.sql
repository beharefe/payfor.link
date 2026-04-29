-- Track payment method type per order for Atlas promo accounting
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_fee_covered BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_fee_cents INTEGER DEFAULT 0;

COMMENT ON COLUMN orders.payment_method_type IS 'Stripe payment method type: card, apple_pay, google_pay, link, blik, sepa_debit etc.';
COMMENT ON COLUMN orders.stripe_fee_covered IS 'Whether the Stripe processing fee is covered by the Atlas $100K promo (card-rate methods only)';
COMMENT ON COLUMN orders.stripe_fee_cents IS 'Actual Stripe processing fee in cents for this transaction';
