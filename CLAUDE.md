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

# Google Safe Browsing
GOOGLE_SAFE_BROWSING_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Key Architecture Decisions

### Auth
- Magic link only (Supabase) — no passwords ever
- Sellers = Supabase users with row in `users` table
- Buyers = email only, no account required
- Middleware protects: `/dashboard` and all `/dashboard/*` routes (e.g. `/dashboard/links/new`, `/dashboard/links/[id]`, `/dashboard/settings`)

### Stripe Connect — Deferred Onboarding
- Sellers connect Stripe with `collect: 'eventually_due'` — no KYC upfront
- Links go active immediately after OAuth
- KYC only triggered when seller clicks "Withdraw funds"
- `account.updated` webhook syncs `charges_enabled` + `payouts_enabled`
- **Never store payouts in DB** — query Stripe directly: `stripe.payouts.list({}, { stripeAccount: id })`

### Links
- Status: `draft` → `active` → `suspended` | `deleted`
- Draft until seller connects Stripe → then auto-activates
- Slug auto-generated from title, collision-handled
- Minimum price: $9.99
- Rate limits: 20 links/user, 5/day
- `version` auto-increments via DB trigger on seller edits

### Purchases — Immutable Snapshots
- `delivery_url` — snapshot at purchase time, NEVER re-read from `links`
- `product_title` — snapshot
- `price_paid` — snapshot
- `platform_fee` — 4.5% of price_paid, stored for accounting
- `link_version` — which version was purchased
- `stripe_payment_id` — UNIQUE constraint for webhook idempotency

### Unlock Tokens
- 32-byte random, stored as SHA-256 hash
- 24h expiry
- Single-use (`used_at` timestamp)
- Multiple tokens per purchase allowed (resend flow)
- Browser-side confirmation before consuming (prevents email scanner pre-click)
- Separate `unlock_tokens` table — never store on `purchases`

### Webhooks (2 events only)
```
checkout.session.completed  → create purchase → Supabase signInWithOtp(buyer_email) → buyer verifies on success page → then unlock token + email
account.updated             → sync Stripe Connect status → notify seller on KYC complete
```

### Payouts
- **No payouts table** — Stripe is source of truth
- Query: `stripe.payouts.list({}, { stripeAccount: seller.stripe_account_id })`
- Store only: `users.total_earned`, `users.total_fees`, `users.total_paid_out` for fast dashboard

---

## Final Database Schema

```sql
-- users (sellers)
id uuid PK → auth.users.id
email text UNIQUE
name text
stripe_account_id text UNIQUE
stripe_connected boolean DEFAULT false        -- OAuth complete → can sell
stripe_charges_enabled boolean DEFAULT false  -- can accept payments
stripe_payouts_enabled boolean DEFAULT false  -- KYC complete → can withdraw
stripe_details_submitted boolean DEFAULT false
total_earned numeric(10,2) DEFAULT 0
total_fees numeric(10,2) DEFAULT 0
total_paid_out numeric(10,2) DEFAULT 0
username text UNIQUE                          -- Phase 2
avatar_url text                               -- Phase 2
bio text                                      -- Phase 2
created_at, updated_at timestamptz

-- links (products)
id uuid PK
seller_id uuid FK → users.id
slug text UNIQUE per seller
title, description text
destination_url text
price numeric(10,2) CHECK >= 9.99
currency text DEFAULT 'usd'
status text CHECK IN (draft|active|suspended|archived|deleted) DEFAULT 'draft'
-- archived = seller stopped selling, keeps analytics
-- suspended = platform action
product_type text CHECK IN (template|file|access|service|dataset|other)  -- optional
version integer DEFAULT 1                     -- auto-incremented by trigger
preview_image_url text                        -- Phase 2 (used for OG tags immediately)
cta_text text                                 -- Phase 2
expires_at timestamptz                        -- Phase 2
max_purchases integer                         -- Phase 2
total_sales integer DEFAULT 0
total_revenue numeric(10,2) DEFAULT 0
reported_at timestamptz
suspended_reason text
created_at, updated_at timestamptz

-- purchases (immutable snapshots)
id uuid PK
link_id uuid FK → links.id
seller_id uuid FK → users.id
buyer_email text
buyer_email_verified boolean DEFAULT false    -- Phase 2 abuse protection
stripe_payment_id text UNIQUE                 -- idempotency
stripe_checkout_session_id text
delivery_url text NOT NULL                    -- snapshot, never from links table
product_title text NOT NULL                   -- snapshot
price_paid numeric(10,2) NOT NULL             -- snapshot
platform_fee numeric(10,2) NOT NULL           -- 4.5% stored for accounting
currency text DEFAULT 'usd'
link_version integer DEFAULT 1               -- snapshot
status text CHECK IN (paid|refunded|disputed|fraud) DEFAULT 'paid'
refunded_at timestamptz
refund_reason text
stripe_refund_id text
created_at, updated_at timestamptz

-- unlock_tokens
id uuid PK
purchase_id uuid FK → purchases.id
token_hash text UNIQUE                        -- SHA-256 of raw token
expires_at timestamptz NOT NULL               -- now() + 24h
used_at timestamptz                           -- null = unused
created_at timestamptz

-- abuse_reports
id uuid PK
link_id uuid FK → links.id
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
4. **Purchases are immutable** — always use `delivery_url`, never re-read `links.destination_url`
5. **Deferred KYC** — only trigger when seller requests payout
6. **Stripe is source of truth for payouts** — never duplicate payout data in DB
7. **Webhook idempotency** — always check `stripe_payment_id` before inserting
8. **Return 200 to Stripe fast** — capture errors to Sentry, never let webhooks timeout
9. **Simple > complete** — Phase 1 only until first real users
