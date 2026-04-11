-- ============================================================
-- PROMOTIONS SYSTEM
-- ============================================================

-- 1. Promotion definitions (the template/type)
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE, -- optional human-readable code e.g. 'LAUNCH2026', null = auto-applied
  name TEXT NOT NULL, -- display name e.g. "Launch Fee Waiver"
  description TEXT, -- shown in dashboard banner
  type TEXT NOT NULL CHECK (type IN (
    'fee_waiver_gmv',      -- waive platform fee up to X gross sales volume
    'fee_rate_reduction',  -- reduce fee rate by X% for Y days
    'flat_credit',         -- add $X credit to seller balance
    'feature_unlock'       -- unlock a feature for Y days
  )),
  -- Config stored as JSONB — schema depends on type:
  -- fee_waiver_gmv:      { "waiver_cents": 50000 }
  -- fee_rate_reduction:  { "reduction_bps": 200, "duration_days": 30 }
  -- flat_credit:         { "credit_cents": 1000 }
  -- feature_unlock:      { "feature_key": "analytics_pro", "duration_days": 90 }
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_apply_on_signup BOOLEAN NOT NULL DEFAULT false, -- if true, grant to every new seller
  max_redemptions INTEGER, -- null = unlimited
  redemption_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- null = no expiry
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Seller <> Promotion grants (one row per seller per promotion)
CREATE TABLE seller_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,

  -- Status lifecycle: active → exhausted | expired | revoked
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'exhausted',  -- used up (e.g. hit GMV cap)
    'expired',    -- time expired
    'revoked'     -- manually revoked by admin
  )),

  -- Generic usage tracking (meaning depends on promotion type)
  -- fee_waiver_gmv:     used_value = GMV processed under waiver (cents)
  --                     max_value  = waiver cap (cents, copied from promotion.config)
  -- fee_rate_reduction: used_value = days elapsed, max_value = duration_days
  -- flat_credit:        used_value = credits spent (cents), max_value = credit_cents
  -- feature_unlock:     used_value = days elapsed, max_value = duration_days
  used_value BIGINT NOT NULL DEFAULT 0,
  max_value BIGINT NOT NULL DEFAULT 0, -- copied from promotion config at grant time

  -- Snapshot of config at grant time (in case promotion config changes later)
  config_snapshot JSONB NOT NULL DEFAULT '{}',

  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- null = no expiry, computed at grant time
  exhausted_at TIMESTAMPTZ,

  -- Audit
  granted_by TEXT DEFAULT 'system', -- 'system' | 'admin:{admin_id}' | 'code:{code}'
  notes TEXT,

  UNIQUE(seller_id, promotion_id), -- one grant per seller per promotion
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Per-transaction promotion usage log (for auditability + refund reversal)
CREATE TABLE promotion_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_promotion_id UUID NOT NULL REFERENCES seller_promotions(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,

  -- What triggered this usage entry
  event_type TEXT NOT NULL CHECK (event_type IN (
    'payment_succeeded',
    'payment_refunded',   -- negative delta (reversal)
    'manual_adjustment',
    'expiry_check'
  )),

  stripe_payment_intent_id TEXT, -- for payment events
  stripe_charge_id TEXT,

  -- The amounts involved
  gross_amount_cents BIGINT,    -- sale gross
  fee_before_cents BIGINT,      -- what fee would have been
  fee_after_cents BIGINT,       -- what fee actually was
  benefit_applied_cents BIGINT, -- savings / benefit value applied

  -- Delta to seller_promotions.used_value (can be negative for refunds)
  used_value_delta BIGINT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_seller_promotions_seller_id ON seller_promotions(seller_id);
CREATE INDEX idx_seller_promotions_status ON seller_promotions(status);
CREATE INDEX idx_seller_promotions_active ON seller_promotions(seller_id, status) WHERE status = 'active';
CREATE INDEX idx_promotion_usage_seller ON promotion_usage_log(seller_id);
CREATE INDEX idx_promotion_usage_payment ON promotion_usage_log(stripe_payment_intent_id);
CREATE INDEX idx_promotions_auto_apply ON promotions(auto_apply_on_signup) WHERE auto_apply_on_signup = true AND is_active = true;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_promotions_updated_at
  BEFORE UPDATE ON seller_promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RPC: atomic redemption counter
-- ============================================================
CREATE OR REPLACE FUNCTION increment_promotion_redemptions(promotion_id UUID)
RETURNS void AS $$
  UPDATE promotions
  SET redemption_count = redemption_count + 1
  WHERE id = promotion_id;
$$ LANGUAGE sql;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE seller_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sellers_own_promotions" ON seller_promotions
  FOR SELECT USING (seller_id = auth.uid());

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_public_read" ON promotions
  FOR SELECT USING (is_active = true);

ALTER TABLE promotion_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sellers_own_usage_log" ON promotion_usage_log
  FOR SELECT USING (seller_id = auth.uid());

-- ============================================================
-- SEED: The launch fee waiver promotion
-- ============================================================
INSERT INTO promotions (
  code,
  name,
  description,
  type,
  config,
  is_active,
  auto_apply_on_signup,
  max_redemptions,
  valid_until
) VALUES (
  'LAUNCH2026',
  'Launch Fee Waiver',
  'Your first $500 in sales are completely fee-free. No platform cut — just Stripe''s standard processing.',
  'fee_waiver_gmv',
  '{"waiver_cents": 50000}',
  true,
  true,   -- auto-apply to every new seller
  null,   -- unlimited redemptions
  '2026-12-31 23:59:59+00'
);
