# payfor.link

A minimal platform where sellers paste any link, set a price, and share a paywall URL. Buyers pay via Stripe and receive email-based access.

**Core mechanic**: Lock link → Pay → Unlock

---

## Stack

| Layer | Tech |
|---|---|
| Frontend / Backend | Next.js (App Router) |
| Hosting | Vercel |
| Database + Auth | Supabase (Postgres + magic link auth) |
| Payments | Stripe Checkout + Stripe Connect Express |
| Email | Resend |
| Analytics | Amplitude or PostHog |

---

## Docs

Read these before writing any code:

| Doc | Path | What it covers |
|---|---|---|
| PRD | `/docs/prd.md` | Product summary, features, phases, success metrics |
| System Flows | `/docs/flows.md` | All high-level flows: seller, buyer, payment, unlock, revenue |
| Architecture | `/docs/architecture.md` | System architecture diagram (Mermaid + ASCII) |
| Database | `/docs/database.md` | Schema, entity relationships, external service data flows |
| UX Spec | `/docs/ux.md` | Design system, colors, components, every page layout |
| Revenue | `/docs/revenue.md` | Fee model (4.5%), pricing strategy, future plans |
| Security | `/docs/security.md` | Abuse handling, link safety, moderation workflow |
| SEO | `/docs/seo.md` | Marketing page strategy, content standards, metadata rules |
| Delivery | `/docs/delivery.md` | Token-based unlock system, anti-abuse measures |
| Template Delivery | `/docs/template-delivery.md` | Notion/Figma/Drive/GitHub delivery specifics |
| Creator Onboarding | `/docs/creator-onboarding.md` | Per-platform setup guides for sellers |
| Product Validation | `/docs/product-validation.md` | Pre-publish link validation rules |
| ADR-001 | `/docs/adr/adr-001.md` | Link lifecycle, purchase model, tokens, slugs, pricing floor |
| ADR-002 | `/docs/adr/adr-002.md` | Delivery URL snapshot, refund UX, token expiry, final schema |

---

## Key Decisions (summary)

**Auth**
- Magic link only via Supabase — no passwords ever
- Sellers = Supabase users
- Buyers = email only, no account required

**Links**
- Status enum: `draft` | `active` | `suspended` | `deleted`
- Slug auto-generated from title, collision-handled (`notion-crm-template-2`)
- Minimum price: $3
- Limits: 20 links per user, 5 per day

**Purchases**
- `purchases.delivery_url` is snapshotted at purchase time — never read from `links.destination_url`
- This ensures deleted/edited products don't break existing buyer access
- Idempotency: `stripe_payment_id` is UNIQUE — duplicate webhooks ignored
- Status enum: `paid` | `refunded` | `disputed`

**Unlock tokens**
- Separate `unlock_tokens` table (not stored in purchases)
- 32-byte random, stored hashed, single-use, 30-minute expiry
- Multiple tokens per purchase allowed (for resend flows)
- Browser-side confirmation step before consuming token (prevents email scanner pre-click)

**Payments**
- Platform fee: 4.5% via Stripe Connect application fee
- Stripe Checkout: hosted redirect for MVP
- Seller must connect Stripe before going live (Stripe Connect Express)
- Platform never holds seller funds

**Database schema (final)**

```sql
-- users
id uuid
email text
name text
stripe_account_id text
created_at timestamp

-- links
id uuid
seller_id uuid → users.id
slug text unique
title text
description text
destination_url text
price numeric
status text  -- draft | active | suspended | deleted
created_at timestamp

-- purchases
id uuid
link_id uuid → links.id
buyer_email text
stripe_payment_id text unique
amount numeric
delivery_url text  -- snapshot of destination_url at purchase time
status text        -- paid | refunded | disputed
created_at timestamp

-- unlock_tokens
id uuid
purchase_id uuid → purchases.id
token_hash text
expires_at timestamp
used_at timestamp
created_at timestamp
```

**API endpoints**

```
POST /api/create-product
POST /api/create-checkout
POST /api/stripe-webhook
POST /api/connect-stripe
GET  /api/purchases
POST /api/unlock-request
```

---

## Design System (quick ref)

Full spec in `/docs/ux.md`. Key tokens:

**Light mode**
- Background: `#F5F4EF` (warm off-white)
- Surface: `#FFFFFF`
- Text: `#111111`
- CTA button: black pill (`#111111` bg, `#FFFFFF` text)
- Success: `#1A7A4A`

**Dark mode**
- Background: `#111111`
- Surface: `#1C1C1C`
- Text: `#F5F4EF`
- CTA button: cream pill (`#F5F4EF` bg, `#111111` text)

**Font**: DM Sans (400, 500 weights only)
**Components**: shadcn/ui + Tailwind CSS
**Border radius**: 100px for buttons (pill), 12px for inputs, 16px for cards

---

## Core Principles

1. **Never host content** — platform controls access, not files
2. **Stripe handles money** — never hold funds, never touch raw card data
3. **One thing per screen** — WeTransfer philosophy
4. **Purchases are immutable snapshots** — always use `delivery_url`, never re-read from `links`
5. **Simple > complete** — if a feature isn't in Phase 1, don't build it yet
