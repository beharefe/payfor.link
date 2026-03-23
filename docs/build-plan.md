# Build Plan — unseal.link MVP

## Philosophy

Build Phase 1 only. Ship a working product.
Schema is designed once — no migrations after MVP.

---

## Stripe Connect — Deferred Onboarding Strategy

**Core principle**: sellers connect Stripe with minimal friction upfront.
KYC is deferred until they request their first payout.

```
Step 1 — Seller connects Stripe (OAuth only)
  → Stripe creates Express account
  → No KYC required yet
  → stripe_connected = true
  → Link goes active immediately

Step 2 — Buyer pays
  → Money held in seller's Stripe connected account
  → Platform fee (4.5%) deducted automatically
  → Seller sees earnings balance in dashboard
  → Cannot withdraw yet unless KYC done

Step 3 — Seller clicks "Withdraw funds"
  → If stripe_payouts_enabled = false → trigger Stripe KYC flow
  → Seller completes identity + bank account verification
  → account.updated webhook fires when payouts_enabled = true
  → Payout released

Step 4 — Stripe transfers to seller bank account
```

**Why deferred onboarding:**
- Sellers have zero earnings at signup — KYC at that point causes dropoff
- They only need to verify identity when they actually have money to collect
- Stripe fully supports this pattern with Express accounts

---

## Webhooks

Two events only:

```
checkout.session.completed   → buyer paid → create purchase → send OTP to buyer email
account.updated              → seller KYC complete → enable payouts
```

Local dev:
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook \
  --events checkout.session.completed,account.updated
```

Production: add both events in Stripe Dashboard → Webhooks → your endpoint.

---

## Schema (Final — Run Once)

Design principle: add every column you'll need in Phase 2/3 now, with safe defaults.
Never ALTER a production table if you can avoid it.

```sql
-- ============================================================
-- USERS (sellers)
-- ============================================================
create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  name            text,

  -- Stripe Connect (deferred onboarding)
  stripe_account_id          text unique,
  stripe_connected           boolean not null default false,  -- OAuth done → can sell
  stripe_charges_enabled     boolean not null default false,  -- can accept payments
  stripe_payouts_enabled     boolean not null default false,  -- KYC done → can withdraw
  stripe_details_submitted   boolean not null default false,  -- onboarding form submitted

  -- Earnings totals (updated on each purchase webhook)
  total_earned    numeric(10,2) not null default 0,  -- gross revenue (updated on each purchase webhook)
  total_fees      numeric(10,2) not null default 0,  -- platform fees collected

  -- Phase 2: seller profile
  username        text unique,
  avatar_url      text,
  bio             text,

  -- Meta
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

  -- Status lifecycle: draft | active | suspended | archived | deleted
  status          text not null default 'draft'
                    check (status in ('draft','active','suspended','archived','deleted')),
  -- archived = seller stopped selling but keeps analytics
  -- suspended = platform action
  -- deleted = soft delete

  -- Version tracking — auto-incremented by trigger on seller edits
  version         integer not null default 1,

  -- Product type (optional — useful for filtering later)
  product_type    text check (product_type in ('template','file','access','service','dataset','other')),

  -- Phase 2
  preview_image_url text,
  cta_text          text,
  expires_at        timestamptz,   -- null = never expires
  max_purchases     integer,       -- null = unlimited

  -- Stats cache (updated via webhook)
  total_sales     integer not null default 0,
  total_revenue   numeric(10,2) not null default 0,

  -- Moderation
  reported_at       timestamptz,
  suspended_reason  text,

  -- Meta
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique(slug)   -- globally unique: slugs include a random 4-char suffix (title-a3f2)
);

-- ============================================================
-- PURCHASES (immutable snapshots)
-- ============================================================
create table purchases (
  id                          uuid primary key default gen_random_uuid(),
  link_id                     uuid not null references links(id),
  seller_id                   uuid not null references users(id),

  -- Buyer (no account required)
  buyer_email                 text not null,
  buyer_email_verified        boolean not null default false,  -- verified via OTP before unlock is issued

  -- Email verification via Supabase Auth OTP (signInWithOtp / verifyOtp). Columns below unused when using Supabase OTP.
  otp_code_hash               text,           -- legacy: unused with Supabase OTP
  otp_expires_at              timestamptz,
  otp_attempts                integer not null default 0,

  -- Stripe
  stripe_payment_id           text not null unique,   -- idempotency key
  stripe_checkout_session_id  text,

  -- Immutable snapshot at purchase time
  delivery_url                text not null,          -- never read from links table
  product_title               text not null,          -- snapshot of links.title
  price_paid                  numeric(10,2) not null, -- snapshot of links.price
  platform_fee                numeric(10,2) not null, -- 4.5% of price_paid
  currency                    text not null default 'usd',
  link_version                integer not null default 1, -- which version was bought

  -- Status
  status                      text not null default 'paid'
                                check (status in ('paid','refunded','disputed','fraud')),

  -- Refund tracking
  refunded_at                 timestamptz,
  refund_reason               text,
  stripe_refund_id            text,

  -- Meta
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ============================================================
-- UNLOCK TOKENS
-- ============================================================
create table unlock_tokens (
  id            uuid primary key default gen_random_uuid(),
  purchase_id   uuid not null references purchases(id) on delete cascade,
  token_hash    text not null unique,   -- sha256 of raw token
  expires_at    timestamptz not null,   -- now() + 24h (not 30min — buyers open email later)
  used_at       timestamptz,            -- null = not yet used
  created_at    timestamptz not null default now()
);

-- NOTE: No payouts table.
-- Stripe is source of truth for payout history.
-- Query: stripe.payouts.list({}, { stripeAccount: seller.stripe_account_id })

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
-- Only increments when seller-editable fields change
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

-- Users
create policy "users: select own" on users
  for select using (auth.uid() = id);
create policy "users: update own" on users
  for update using (auth.uid() = id);
create policy "users: insert own" on users
  for insert with check (auth.uid() = id);

-- Links: sellers manage own, public reads active
create policy "links: seller full access" on links
  for all using (auth.uid() = seller_id);
create policy "links: public read active" on links
  for select using (status = 'active');

-- Purchases: sellers see their sales
create policy "purchases: seller sees own" on purchases
  for select using (auth.uid() = seller_id);

-- NOTE: No payouts table — Stripe is source of truth.
-- Query payout history via: stripe.payouts.list({}, { stripeAccount: seller.stripe_account_id })

-- Unlock tokens: no client policies — RLS enabled with zero policies = blanket deny for all
-- client roles. Service role key bypasses RLS entirely. Only ever touch unlock_tokens
-- server-side using the service role key. Never expose to browser clients.

-- Abuse reports: anyone can insert. Rate limiting handled at API route level, not DB.
create policy "abuse_reports: public insert" on abuse_reports
  for insert with check (true);
```

---

## Build Order — Phase 1

### Step 1 — Project Setup
- [ ] `npx create-next-app@latest unseal-link --typescript --tailwind --app`
- [ ] Install: `shadcn/ui`, `@supabase/supabase-js`, `@supabase/ssr`, `stripe`, `next-axiom`, `resend`, `@amplitude/analytics-browser`, `slugify`, `@sentry/nextjs`
  - Logging: `next-axiom` only — it ships logs to Axiom and provides `log` helpers for server/edge. No need for `pino`/`pino-pretty`.
- [ ] Copy `.env.local`
- [ ] Run schema SQL in Supabase
- [ ] `npx @sentry/wizard@latest -i nextjs`
- [ ] Configure `next.config.ts` with `withAxiom`
- [ ] Set up `lib/supabase/client.ts` + `lib/supabase/server.ts`
- [ ] Set up `lib/stripe.ts`
- [ ] Set up `lib/logger.ts`
- [ ] Set up `lib/resend.ts`
- [ ] Set up `middleware.ts` (protect seller routes)

---

### Step 2 — Auth
**Pages**: `/auth`, `/auth/confirm`
**Logic**:
- Supabase magic link — email OTP, no password ever
- On first login → upsert row in `users` table
- Middleware protects `/studio` (seller) and `/orders` (buyer) routes

---

### Step 3 — Create Product
**Pages**: `/studio/links/new`
**Actions**: `createProduct()`
**Logic**:
- Validate URL format
- Google Safe Browsing check
- Detect platform from domain (notion/figma/drive/github/other) → auto-set `product_type`
- Auto-generate slug: `slugify(title) + "-" + crypto.randomBytes(2).toString("hex")` → e.g. `notion-crm-a3f2`
  - Globally unique — check `links.slug` without seller filter, retry up to 5× with new suffix
- Insert `links` row with `status = 'draft'`
- If seller `stripe_connected = true` → set `status = 'active'` immediately
- Redirect to `/studio/links/[id]` — the activation/copy-link moment

**Form fields**:
- Title (required)
- Description (optional)
- Destination URL (required)
- Price — with quick-select presets: `$5 · $9 · $19 · $49` (clicking fills the input)
- Product type — optional dropdown auto-detected, seller can override

**Validation**:
- Notion: `notion.so` or `notion.site` + `?duplicate=true`
- Figma: `figma.com` + view access
- Drive: `docs.google.com` or `drive.google.com`
- GitHub: `github.com` public repo
- Unknown: warning only, don't block

---

### Step 4 — Seller Dashboard + Product Detail
**Pages**: `/studio` (seller home), `/studio/links/[id]` (link detail)
**Logic (`/studio/links/[id]` — the activation moment)**:
- Show "🎉 Your paywall is ready" hero section
- Large copy-link button — this is the primary CTA on this page
- Share prompt: "Share on Twitter · Discord · Email"
- Stripe connect CTA if not connected
- Edit / Archive / Delete actions

**Logic (`/studio`)**:
- Fetch seller's links + per-link stats
- Show total earnings (query Stripe balance)
- "Withdraw funds" button
- "Copy URL" on each link row — most-used action
- Real-time new order toast (Supabase Realtime `purchases` INSERT → `router.refresh()` + toast)

---

### Step 5 — Stripe Connect (Deferred Onboarding)
**API**: `POST /api/connect-stripe`, `GET /api/connect-stripe/return`, `GET /api/connect-stripe/refresh`

**Connect flow (OAuth — no KYC)**:
```
POST /api/connect-stripe
→ if no stripe_account_id: stripe.accounts.create({ type: 'express', email })
→ stripe.accountLinks.create({
    account: stripe_account_id,
    type: 'account_onboarding',
    collect: 'eventually_due',   ← deferred — minimal info now
    return_url, refresh_url
  })
→ redirect seller to Stripe
```

**Return handler**:
```
GET /api/connect-stripe/return
→ stripe.accounts.retrieve(stripe_account_id)
→ set stripe_connected = true
→ set stripe_charges_enabled, stripe_details_submitted from Stripe response
→ activate all seller's draft links → status = 'active'
→ redirect to /studio
```

**Withdraw flow (KYC triggered on demand)**:
```
Seller clicks "Withdraw funds"
→ if stripe_payouts_enabled = false:
    → stripe.accountLinks.create({ collect: 'currently_due' })
    → redirect to Stripe KYC
→ if stripe_payouts_enabled = true:
    → stripe.payouts.create (Stripe handles it — no local record needed)
```

---

### Step 6 — Webhook Handler
**API**: `POST /api/stripe-webhook`

**Event: `checkout.session.completed`**:
```
verify Stripe signature
→ check purchases.stripe_payment_id (idempotency — skip if exists)
→ fetch link (for snapshot)
→ insert purchase:
    buyer_email, stripe_payment_id, stripe_checkout_session_id
    delivery_url (snapshot), product_title (snapshot)
    price_paid (snapshot), platform_fee (price * 0.045)
    link_version (snapshot), seller_id, link_id
→ update links: total_sales++, total_revenue += price
→ update users: total_earned += price, total_fees += platform_fee
→ send verification email via Supabase: signInWithOtp({ email: buyer_email }) (Supabase sends 6-digit OTP or magic link; configure in Supabase Auth)
→ return 200
-- NOTE: unlock token is NOT generated here — only after buyer verifies OTP on success page
```

**Event: `account.updated`**:
```
verify Stripe signature
→ find user by stripe_account_id
→ update:
    stripe_charges_enabled = account.charges_enabled
    stripe_payouts_enabled = account.payouts_enabled
    stripe_details_submitted = account.details_submitted
→ if payouts_enabled just became true:
    → send seller email: "You can now withdraw your earnings"
→ return 200
```

**Critical**: always return 200 to Stripe even on internal error. Capture exceptions to Sentry before returning.

---

### Step 7 — Paywall Page
**Pages**: `/pay/[slug]`
**Logic**:
- Fetch link by slug where `status = 'active'`
- Show unavailable state if `suspended` | `archived` | `deleted`
- No nav, no escape hatches
- Show: title, description, price, seller name, CTA button
- Price presets not shown here (seller-side only) — just show the set price clearly
- CTA calls `POST /api/create-checkout`
- Track `paywall_viewed` server-side on every load (see analytics.md)

**SEO / OG tags** (use Next.js `generateMetadata`):
```
og:title    = "{title} — ${price}"
og:description = link.description or "Pay once and get instant access."
og:image    = preview_image_url ?? /og-default.png (1200×630)
og:url      = https://unseal.link/pay/{slug}
twitter:card = summary_large_image
product:price:amount = price
product:price:currency = USD
```

OG tags are the #1 distribution multiplier — makes shared links show rich previews on
Twitter, Slack, Discord, Telegram, iMessage, LinkedIn.

---

### Step 8 — Stripe Checkout Session
**API**: `POST /api/create-checkout`
```
receive { link_id }
→ fetch link (must be active)
→ fetch seller (must have stripe_charges_enabled)
→ stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price_data: { unit_amount: price * 100 }, quantity: 1 }],
    payment_intent_data: {
      application_fee_amount: Math.round(price * 0.045 * 100),
      transfer_data: { destination: seller.stripe_account_id }
    },
    success_url: /pay/[slug]/success?session_id={CHECKOUT_SESSION_ID},
    cancel_url: /pay/[slug],
    metadata: { link_id, link_version }
  })
→ return { url }
```

---

### Step 9 — Payment Success + OTP Verification
**Pages**: `/pay/[slug]/success`
**Actions**: `verifyOtp()`, `resendOtp()`

**We use Supabase Auth OTP** for post-purchase email verification (same system as seller magic link, different use case):
- **Webhook**: after creating the purchase, call `supabase.auth.signInWithOtp({ email: buyer_email })` so Supabase sends the 6-digit OTP (or magic link, per project settings).
- **Success page**: user enters the code; we call `supabase.auth.verifyOtp({ email, token, type: 'email' })`. On success we set `buyer_email_verified`, create the unlock token, and send the unlock email via Resend.
- **Resend code**: `signInWithOtp` again; Supabase handles rate limits and expiry. No custom OTP storage or hashing.

**Logic**:
- Read `session_id` from URL params
- Fetch Stripe session → get `customer_email`
- Show OTP input: "Enter the 6-digit code we sent to {email}"
- `verifyOtp(purchase_id, code)`:
  ```
  → load purchase by id, get buyer_email
  → supabase.auth.verifyOtp({ email: buyer_email, token: code, type: 'email' })
  → if error (expired/invalid): return error
  → set buyer_email_verified = true
  → generate unlock token (32 bytes → sha256 → store hashed)
  → send unlock email via Resend
  → return { success: true }
  ```
- `resendOtp(purchase_id)`:
  ```
  → supabase.auth.signInWithOtp({ email: purchase.buyer_email })
  → Supabase sends OTP email and enforces rate limits
  ```
- After successful verify → redirect to `/orders/[purchase_id]`
- If purchase not yet created (webhook in-flight): client polls every 2s (`SuccessPoller`) until purchase appears, then shows OTP form

---

### Step 10 — Unlock Flow (email link — sessionless re-access)
**Pages**: `/unlock`, `/unlock-request`
**API**: `POST /api/resend-unlock`

**Unlock**:
```
GET /unlock?token=xxx
→ hash token → lookup by token_hash
→ check: exists / not used (used_at IS NULL) / not expired / purchase not refunded
→ if invalid: show error page (do NOT redirect)
→ if valid: show confirmation screen — "You're one click away · {product_title}"
    NEVER consume token on GET — email scanners pre-fetch and would burn it silently

User clicks "Access content →" (Server Action form POST):
→ re-validate token atomically
→ UPDATE unlock_tokens SET used_at = now() WHERE id = ? AND used_at IS NULL
→ fetch purchase.delivery_url
→ 302 redirect → delivery_url
```

**Resend**:
```
POST /api/resend-unlock { email }
→ find purchases by buyer_email where status = 'paid'
→ for each: invalidate old unused tokens, generate new token, send email
→ rate limit: max 3 resends per purchase per hour
```

---

### Step 11 — Buyer Orders (session-based)
**Pages**: `/orders` (list), `/orders/[order_id]` (detail)
**API**: `GET /api/orders/[order_id]/access`
**Logic**:
- Middleware protects both routes — session required
- `/orders`: fetch all purchases WHERE buyer_email = user.email AND status = 'paid'
- `/orders/[id]`: verify ownership (buyer_email = user.email), show order detail
  - `delivery_url` is NEVER rendered in HTML
- "Access content →" → `GET /api/orders/[order_id]/access`
  - Server validates session + ownership → 302 to `purchase.delivery_url`
- noindex on all `/orders/*` pages

---

## Seller Dashboard — Earnings UI

```
Total earnings:     $247.50   (gross)
Platform fees:       -$11.14  (4.5%)
Available balance:  $236.36

[ Withdraw funds → ]

If KYC not done:
  ⚠ Complete identity verification to withdraw
  [ Verify & Withdraw → ]  ← triggers Stripe KYC

Payout history:
  $100.00  Mar 10  ✅ Paid
  $136.36  pending
```

---

## Phase 2 (after first users)
- Abuse reporting button on paywall page
- Preview image upload
- SEO landing pages
- Buyer refund request flow
- Seller refund dashboard
- Seller settings page

## Phase 3 (after traction)
- Custom slugs
- Expiring links
- Purchase limits
- Seller public profile
- Analytics dashboard

---

## Key Rules While Building

1. **Always use `purchase.delivery_url`** — never `links.destination_url` for delivery
2. **Webhook must be idempotent** — check `stripe_payment_id` before inserting
3. **Return 200 to Stripe immediately** — capture errors to Sentry, never let webhook timeout
4. **Never expose `unlock_tokens` to client** — service role only
5. **`links.version` increments automatically** via DB trigger on seller edits
6. **Snapshot `link_version` in purchase** — know which version was bought
7. **Slug lookups always filter `status = 'active'`** — never serve draft/suspended
8. **Deferred KYC** — only trigger when seller requests payout, never at signup
