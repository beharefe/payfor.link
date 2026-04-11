# Database Schema — unseal.link

Run this SQL in your Supabase project → SQL Editor.
Run once. Do not alter production tables after deploy.

---

```sql
-- ============================================================
-- SELLERS
-- ============================================================
create table sellers (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  name            text,

  -- Stripe Connect (deferred onboarding)
  stripe_account_id          text unique,
  stripe_connected           boolean not null default false,
  stripe_charges_enabled     boolean not null default false,
  stripe_payouts_enabled     boolean not null default false,
  stripe_details_submitted   boolean not null default false,

  -- Earnings totals (updated on each purchase webhook)
  total_earned    numeric(10,2) not null default 0,
  total_fees      numeric(10,2) not null default 0,

  -- Phase 2
  username        text unique,
  avatar_url      text,
  bio             text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS (paywall links)
-- ============================================================
create table products (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references sellers(id) on delete cascade,
  slug            text not null,
  title           text not null,
  description     text,
  destination_url text not null,
  price           numeric(10,2) not null check (price >= 9.99),
  currency        text not null default 'usd',

  status          text not null default 'draft'
                    check (status in ('draft','active','suspended','archived','deleted')),

  version         integer not null default 1,

  product_type    text check (product_type in ('template','file','access','service','dataset','other')),

  -- Phase 2
  preview_image_url text,
  cta_text          text,
  expires_at        timestamptz,
  max_orders        integer,

  -- Stats cache (updated via webhook)
  total_sales     integer not null default 0,
  total_revenue   numeric(10,2) not null default 0,

  -- Moderation
  reported_at       timestamptz,
  suspended_reason  text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique(slug)   -- globally unique: slugs include a random 4-char suffix (title-a3f2)
);

-- ============================================================
-- ORDERS (immutable snapshots)
-- ============================================================
create table orders (
  id                          uuid primary key default gen_random_uuid(),
  product_id                  uuid not null references products(id),
  seller_id                   uuid not null references sellers(id),

  -- Buyer (no account required)
  buyer_email                 text not null,
  buyer_email_verified        boolean not null default false,

  -- Custom OTP verification (SHA-256 hashed, stored temporarily until verified)
  otp_hash                    text,
  otp_expires_at              timestamptz,
  otp_attempts                integer not null default 0,

  -- Stripe
  stripe_payment_id           text not null unique,   -- idempotency key
  stripe_checkout_session_id  text,

  -- Immutable snapshot at purchase time
  delivery_url                text not null,          -- never read from products table
  product_title               text not null,          -- snapshot of products.title
  price_paid                  numeric(10,2) not null, -- snapshot of products.price
  platform_fee                numeric(10,2) not null, -- 4.5% of price_paid
  currency                    text not null default 'usd',
  product_version             integer not null default 1, -- which version was bought

  -- Status
  status                      text not null default 'paid'
                                check (status in ('paid','refunded','disputed','fraud')),

  -- Refund tracking
  refunded_at                 timestamptz,
  refund_reason               text,
  stripe_refund_id            text,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ============================================================
-- ACCESS TOKENS
-- ============================================================
create table access_tokens (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  token_hash    text not null unique,   -- sha256 of raw token
  expires_at    timestamptz not null,   -- now() + 24h
  used_at       timestamptz,            -- null = not yet used
  created_at    timestamptz not null default now()
);

-- NOTE: No payouts table.
-- Stripe is source of truth for payout history.
-- Query: stripe.payouts.list({}, { stripeAccount: seller.stripe_account_id })

-- ============================================================
-- REPORTS
-- ============================================================
create table reports (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id),
  reporter_email  text,
  reason          text not null
                    check (reason in ('scam','malware','copyright','other')),
  description     text,
  status          text not null default 'pending'
                    check (status in ('pending','reviewed','actioned','dismissed')),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_products_slug on products(slug);
create index idx_products_seller_id on products(seller_id);
create index idx_products_status on products(status);
create unique index idx_orders_stripe_payment_id on orders(stripe_payment_id);
create index idx_orders_buyer_email on orders(buyer_email);
create index idx_orders_product_id on orders(product_id);
create index idx_orders_seller_id on orders(seller_id);
create unique index idx_access_tokens_hash on access_tokens(token_hash);
create index idx_access_tokens_order_id on access_tokens(order_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sellers_updated_at
  before update on sellers
  for each row execute function set_updated_at();

create trigger products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ============================================================
-- VERSION INCREMENT TRIGGER (products only)
-- ============================================================
create or replace function increment_product_version()
returns trigger as $$
begin
  if (
    old.title is distinct from new.title or
    old.description is distinct from new.description or
    old.destination_url is distinct from new.destination_url or
    old.price is distinct from new.price or
    old.cta_text is distinct from new.cta_text or
    old.preview_image_url is distinct from new.preview_image_url
  ) then
    new.version = old.version + 1;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger products_version_increment
  before update on products
  for each row execute function increment_product_version();

-- ============================================================
-- ATOMIC STAT INCREMENT FUNCTIONS
-- Called from the Stripe webhook via supabase.rpc() to avoid
-- read-modify-write races when multiple purchases complete concurrently.
-- ============================================================
create or replace function increment_product_stats(p_product_id uuid, p_revenue numeric)
returns void language sql security definer as $$
  update products
  set total_sales   = total_sales + 1,
      total_revenue = total_revenue + p_revenue
  where id = p_product_id;
$$;

create or replace function increment_seller_stats(p_seller_id uuid, p_earned numeric, p_fees numeric)
returns void language sql security definer as $$
  update sellers
  set total_earned = total_earned + p_earned,
      total_fees   = total_fees + p_fees
  where id = p_seller_id;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table sellers enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table access_tokens enable row level security;
alter table reports enable row level security;

-- Sellers
create policy "sellers: select own" on sellers
  for select using (auth.uid() = id);
create policy "sellers: update own" on sellers
  for update using (auth.uid() = id);
create policy "sellers: insert own" on sellers
  for insert with check (auth.uid() = id);

-- Products: sellers manage own, public reads active
create policy "products: seller full access" on products
  for all using (auth.uid() = seller_id);
create policy "products: public read active" on products
  for select using (status = 'active');

-- Orders: sellers see their sales
create policy "orders: seller sees own" on orders
  for select using (auth.uid() = seller_id);

-- NOTE: No payouts table — Stripe is source of truth.
-- Query payout history via: stripe.payouts.list({}, { stripeAccount: seller.stripe_account_id })

-- Access tokens: RLS enabled, zero client policies = blanket deny for all
-- client roles. Service role key bypasses RLS entirely. Only ever touch access_tokens
-- server-side using the service role key. Never expose to browser clients.

-- Reports: anyone can insert. Rate limiting handled at API route level, not DB.
create policy "reports: public insert" on reports
  for insert with check (true);
```
