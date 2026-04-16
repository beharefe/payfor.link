-- Add idempotency guard for the seller welcome email.
-- Prevents re-sending if account.updated fires multiple times after charges_enabled.
ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT false;
