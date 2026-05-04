# unseal.link

A minimal platform where sellers paste any link, set a price, and share a paywall URL. Buyers pay via Stripe and receive email-based access. No storefronts, no platform lock-in.

**Core mechanic**: Lock link → Pay → Unlock

---

## Stack

| Layer | Tech |
|---|---|
| Frontend / Backend | Next.js 15 (App Router) |
| Hosting | Vercel |
| Database + Auth | Supabase (Postgres + magic link auth) |
| Payments | Stripe Checkout + Stripe Connect Express |
| Email | Resend |
| Analytics | Amplitude (10M events/month free) |
| Logging | pino + next-axiom → Axiom (500MB/day, 30d retention free) |
| Error Tracking | Sentry |

---

## Docs — Read Before Writing Any Code

| Doc | Path | What it covers |
|---|---|---|
| **Build Plan** | `/docs/build-plan.md` | Schema, build order, step-by-step logic per feature — START HERE |
| PRD | `/docs/prd.md` | Product summary, features, phases, success metrics |
| System Flows | `/docs/flows.md` | All flows including corrected Stripe Connect deferred onboarding |
| Architecture | `/docs/architecture.md` | System diagram |
| Database | `/docs/database.md` | Entity relationships, external service data flows |
| UX Spec | `/docs/ux.md` | Design system, colors (WeTransfer palette), components, every page layout |
| Revenue | `/docs/revenue.md` | Fee model (4.5%), future pricing tiers |
| Security | `/docs/security.md` | Abuse handling, link safety, moderation workflow |
| SEO | `/docs/seo.md` | Marketing page strategy, metadata rules, AI bot crawling |
| Delivery | `/docs/delivery.md` | Token-based unlock system, anti-abuse |
| Template Delivery | `/docs/template-delivery.md` | Notion/Figma/Drive/GitHub delivery specifics |
| Creator Onboarding | `/docs/creator-onboarding.md` | Per-platform setup guides for sellers |
| Product Validation | `/docs/product-validation.md` | Pre-publish link validation rules |
| Logging | `/docs/logging.md` | pino + Axiom setup, structured logging patterns |
| Analytics | `/docs/analytics.md` | Amplitude setup, 6 core events (paywall_viewed first), server-side tracking |
| Error Tracking | `/docs/error-tracking.md` | Sentry setup, critical errors, alerts |
| ADR-001 | `/docs/adr/adr-001.md` | Link lifecycle, tokens, slugs, pricing floor decisions |
| ADR-002 | `/docs/adr/adr-002.md` | Delivery URL snapshot, refund UX, token expiry, schema |

---

## Environment Variables

```env
# Supabase (use publishable + secret keys per https://supabase.com/docs/guides/api/api-keys)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # sb_publishable_... (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)
SUPABASE_SECRET_KEY=                     # sb_secret_... (or legacy SUPABASE_SERVICE_ROLE_KEY)

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=        # from: stripe listen --forward-to localhost:3000/api/stripe-webhook

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@unseal.link

# Axiom (logging)
NEXT_PUBLIC_AXIOM_DATASET=
NEXT_PUBLIC_AXIOM_TOKEN=

# Amplitude (analytics)
NEXT_PUBLIC_AMPLITUDE_API_KEY=

# Sentry (error tracking)
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Solana (crypto payments — requires EXPERIMENTAL_CRYPTO_ENABLED=true)
SOLANA_RPC_URL=                        # server-side RPC (action-code-checkout, solana-confirm)
NEXT_PUBLIC_SOLANA_RPC_URL=            # client-side RPC for @solana/wallet-adapter ConnectionProvider
EXPERIMENTAL_CRYPTO_ENABLED=false

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Key Architecture Decisions

### Auth
- Magic link only (Supabase) — no passwords ever
- Sellers = Supabase users with row in `users` table
- Buyers = email only, no account required
- `src/proxy.ts` protects: `/dashboard` and `/onboarding` routes — redirects unauthenticated users to `/auth`

### Stripe Connect — Deferred Onboarding
- Sellers connect Stripe with `collect: 'eventually_due'` — no KYC upfront
- Links go active immediately after OAuth
- KYC only triggered when seller clicks "Withdraw funds"
- `account.updated` webhook syncs `charges_enabled` + `payouts_enabled`
- **Never store payouts in DB** — query Stripe directly: `stripe.payouts.list({}, { stripeAccount: id })`

### Products
- Status: `draft` → `active` → `suspended` | `deleted`
- Draft until seller connects Stripe → then auto-activates
- Slug auto-generated from title, collision-handled
- Minimum price: $9.99
- Rate limits: 20 products/user, 5/day
- `version` auto-increments via DB trigger on seller edits

### Orders — Immutable Snapshots
- `delivery_url` — snapshot at purchase time, NEVER re-read from `products`
- `product_title` — snapshot
- `price_paid` — snapshot
- `platform_fee` — 4.5% of price_paid, stored for accounting
- `product_version` — which version was purchased
- `stripe_payment_id` — UNIQUE constraint for webhook idempotency

### Access Tokens
- 32-byte random, stored as SHA-256 hash
- 24h expiry
- Single-use (`used_at` timestamp)
- Multiple tokens per order allowed (resend flow)
- Browser-side confirmation before consuming (prevents email scanner pre-click)
- Separate `access_tokens` table — never store on `orders`

### Webhooks (4 events)
```
checkout.session.completed  → create order → generate access token → send access email via Resend (no OTP — token sent directly)
account.updated             → sync Stripe Connect status → notify seller on KYC complete
charge.dispute.created      → set order status = 'disputed' → alert seller + admin
charge.refunded             → set order status = 'refunded' → reverse promotion usage
```

### Payouts
- **No payouts table** — Stripe is source of truth
- Query: `stripe.payouts.list({}, { stripeAccount: seller.stripe_account_id })`
- Store only: `sellers.total_earned`, `sellers.total_fees` for fast dashboard

---

## Final Database Schema

```sql
-- sellers
id uuid PK → auth.users.id
email text UNIQUE
name text NOT NULL UNIQUE                     -- handle + display name: "alex" → /@alex
stripe_account_id text UNIQUE
stripe_connected boolean DEFAULT false        -- OAuth complete → can sell
stripe_charges_enabled boolean DEFAULT false  -- can accept payments
stripe_payouts_enabled boolean DEFAULT false  -- KYC complete → can withdraw
stripe_details_submitted boolean DEFAULT false
total_earned numeric(10,2) DEFAULT 0
total_fees numeric(10,2) DEFAULT 0
avatar_url text                               -- Phase 2
bio text                                      -- Phase 2
created_at, updated_at timestamptz

-- products (paywall links)
id uuid PK
seller_id uuid FK → sellers.id
slug text UNIQUE
title, description text
destination_url text
price numeric(10,2) CHECK >= 9.99
currency text DEFAULT 'usd'
status text CHECK IN (draft|active|suspended|archived|deleted) DEFAULT 'draft'
-- archived = seller stopped selling, keeps analytics
-- suspended = platform action
product_type text CHECK IN (template|file|access|service|dataset|other)  -- optional
version integer DEFAULT 1                     -- auto-incremented by trigger
preview_image_url text
cta_text text                                 -- Phase 2
expires_at timestamptz                        -- Phase 2
max_orders integer                            -- Phase 2
total_sales integer DEFAULT 0
total_revenue numeric(10,2) DEFAULT 0
reported_at timestamptz
suspended_reason text
created_at, updated_at timestamptz

-- orders (immutable snapshots)
id uuid PK
product_id uuid FK → products.id
seller_id uuid FK → sellers.id
buyer_email text
buyer_email_verified boolean DEFAULT false    -- set true immediately by webhook
stripe_payment_id text UNIQUE                 -- idempotency
stripe_checkout_session_id text
delivery_url text NOT NULL                    -- snapshot, never from products table
product_title text NOT NULL                   -- snapshot
price_paid numeric(10,2) NOT NULL             -- snapshot
platform_fee numeric(10,2) NOT NULL           -- 4.5% stored for accounting
currency text DEFAULT 'usd'
product_version integer DEFAULT 1            -- snapshot
status text CHECK IN (paid|refunded|disputed|fraud) DEFAULT 'paid'
refunded_at timestamptz
refund_reason text
stripe_refund_id text
created_at, updated_at timestamptz

-- access_tokens
id uuid PK
order_id uuid FK → orders.id
token_hash text UNIQUE                        -- SHA-256 of raw token
expires_at timestamptz NOT NULL               -- now() + 24h
used_at timestamptz                           -- null = unused
created_at timestamptz

-- reports
id uuid PK
product_id uuid FK → products.id
reporter_email text
reason text CHECK IN (scam|malware|copyright|other)
description text
status text CHECK IN (pending|reviewed|actioned|dismissed) DEFAULT 'pending'
created_at timestamptz

-- NO payouts table — query Stripe directly
-- stripe.payouts.list({}, { stripeAccount: seller.stripe_account_id })
```

---

## Design System (Quick Ref)

Full spec in `/docs/ux.md`.

**Font**: DM Sans (400, 500 only)
**Components**: shadcn/ui + Tailwind CSS
**Border radius**: 100px buttons (pill), 12px inputs, 16px cards

| Token | Light | Dark |
|---|---|---|
| Background | `#F5F4EF` | `#111111` |
| Surface | `#FFFFFF` | `#1C1C1C` |
| Text primary | `#111111` | `#F5F4EF` |
| Text secondary | `#6B6B6B` | `#999999` |
| CTA button | `#111111` bg / `#FFFFFF` text | `#F5F4EF` bg / `#111111` text |
| Border | `#E5E5E5` | `#2C2C2C` |
| Success | `#1A7A4A` | `#2ECC71` |
| Error | `#C0392B` | `#E74C3C` |

---

## Core Principles

1. **One thing per screen** — WeTransfer philosophy, no distractions
2. **Never host content** — platform controls access, sellers own content
3. **Stripe handles money** — never hold funds, never touch card data
4. **Orders are immutable** — always use `delivery_url`, never re-read `products.destination_url`
5. **Deferred KYC** — only trigger when seller requests payout
6. **Stripe is source of truth for payouts** — never duplicate payout data in DB
7. **Webhook idempotency** — always check `stripe_payment_id` before inserting
8. **Return 200 to Stripe fast** — capture errors to Sentry, never let webhooks timeout
9. **Simple > complete** — Phase 1 only until first real users
