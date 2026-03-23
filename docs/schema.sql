-- unseal.link — Run once in Supabase SQL Editor. Do not alter production tables after deploy.
-- See docs/build-plan.md and docs/schema.md for context.

-- ============================================================
-- USERS (sellers)
-- ============================================================
create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  name            text,

  stripe_account_id          text unique,
  stripe_connected           boolean not null default false,
  stripe_charges_enabled     boolean not null default false,
  stripe_payouts_enabled     boolean not null default false,
  stripe_details_submitted   boolean not null default false,

  total_earned    numeric(10,2) not null default 0,
  total_fees      numeric(10,2) not null default 0,

  username        text unique,
  avatar_url      text,
  bio             text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- LINKS (products)
-- ============================================================
create table links (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references users(id) on delete cascade,
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

  preview_image_url text,
  cta_text          text,
  expires_at        timestamptz,
  max_purchases     integer,

  total_sales     integer not null default 0,
  total_revenue   numeric(10,2) not null default 0,

  reported_at       timestamptz,
  suspended_reason  text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique(seller_id, slug)
);

-- ============================================================
-- PURCHASES (immutable snapshots)
-- ============================================================
create table purchases (
  id                          uuid primary key default gen_random_uuid(),
  link_id                     uuid not null references links(id),
  seller_id                   uuid not null references users(id),

  buyer_email                 text not null,
  buyer_email_verified        boolean not null default false,

  otp_code_hash               text,
  otp_expires_at              timestamptz,
  otp_attempts                integer not null default 0,

  stripe_payment_id           text not null unique,
  stripe_checkout_session_id  text,

  delivery_url                text not null,
  product_title               text not null,
  price_paid                  numeric(10,2) not null,
  platform_fee                numeric(10,2) not null,
  currency                    text not null default 'usd',
  link_version                integer not null default 1,

  status                      text not null default 'paid'
                                check (status in ('paid','refunded','disputed','fraud')),

  refunded_at                 timestamptz,
  refund_reason               text,
  stripe_refund_id            text,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ============================================================
-- UNLOCK TOKENS
-- ============================================================
create table unlock_tokens (
  id            uuid primary key default gen_random_uuid(),
  purchase_id   uuid not null references purchases(id) on delete cascade,
  token_hash    text not null unique,
  expires_at    timestamptz not null,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- ABUSE REPORTS
-- ============================================================
create table abuse_reports (
  id              uuid primary key default gen_random_uuid(),
  link_id         uuid not null references links(id),
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
create index idx_links_slug on links(slug);
create index idx_links_seller_id on links(seller_id);
create index idx_links_status on links(status);
create unique index idx_purchases_stripe_payment_id on purchases(stripe_payment_id);
create index idx_purchases_buyer_email on purchases(buyer_email);
create index idx_purchases_link_id on purchases(link_id);
create index idx_purchases_seller_id on purchases(seller_id);
create unique index idx_unlock_tokens_hash on unlock_tokens(token_hash);
create index idx_unlock_tokens_purchase_id on unlock_tokens(purchase_id);

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

create trigger users_updated_at
  before update on users
  for each row execute function set_updated_at();

create trigger links_updated_at
  before update on links
  for each row execute function set_updated_at();

create trigger purchases_updated_at
  before update on purchases
  for each row execute function set_updated_at();

-- ============================================================
-- VERSION INCREMENT TRIGGER (links only)
-- ============================================================
create or replace function increment_link_version()
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

create trigger links_version_increment
  before update on links
  for each row execute function increment_link_version();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table users enable row level security;
alter table links enable row level security;
alter table purchases enable row level security;
alter table unlock_tokens enable row level security;
alter table abuse_reports enable row level security;

create policy "users: select own" on users
  for select using (auth.uid() = id);
create policy "users: update own" on users
  for update using (auth.uid() = id);
create policy "users: insert own" on users
  for insert with check (auth.uid() = id);

create policy "links: seller full access" on links
  for all using (auth.uid() = seller_id);
create policy "links: public read active" on links
  for select using (status = 'active');

create policy "purchases: seller sees own" on purchases
  for select using (auth.uid() = seller_id);

create policy "abuse_reports: public insert" on abuse_reports
  for insert with check (true);
