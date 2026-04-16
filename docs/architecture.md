# System Architecture

## Stack Overview

```
Browser (Seller / Buyer)
        ↓
Next.js App Router (Vercel)
        ↓
┌────────────────────────────────────────┐
│              Services                  │
│                                        │
│  Supabase Auth    Supabase Postgres    │
│  Stripe Checkout  Stripe Connect       │
│  Resend Email     Google Safe Browsing │
│  Axiom Logs       Amplitude Analytics  │
│  Sentry Errors                         │
└────────────────────────────────────────┘
```

---

## Request Flows

### Seller creates a product
```
Browser → Server Action: createProductAction()
  → Google Safe Browsing: validate URL
  → Supabase: insert products row
  ← redirect to /dashboard/links/[id]
```

### Buyer pays
```
Browser → Server Action: createCheckoutSession()
  → calculateFee() applies any active promotions
  → Stripe: create Checkout Session with fee + metadata
  ← redirect to Stripe hosted checkout
Stripe → POST /api/stripe-webhook (checkout.session.completed)
  → Supabase: insert orders row (delivery_url snapshot)
  → Supabase: insert access_tokens row
  → Resend: send access email to buyer
  ← 200 OK
Browser → /@username/slug/success
```

### Buyer unlocks
```
Email link → GET /orders/access?t=xxx&oid=uuid
  → Supabase: validate access_tokens (hash + order_id)
  → show confirmation screen (do NOT consume on GET)
Buyer clicks "Open link →" → Server Action: consumeToken()
  → mark token used_at = now() WHERE used_at IS NULL
  ← 302 redirect → order.delivery_url (snapshot)
```

### Seller withdraws
```
Browser → "Withdraw funds"
  → Stripe: check balance (stripe.balance.retrieve)
  → if KYC needed: Stripe accountLinks → KYC flow
  → Stripe: account.updated webhook → sync payouts_enabled
  → Stripe: handles payout to bank automatically
```

---

## Sequence Diagram

```
Seller          App             Supabase        Stripe          Resend
  |               |                |               |               |
  |-- create ----→|                |               |               |
  |               |-- insert -----→|               |               |
  |               |-- safe browse →|               |               |
  |←- paywall URL-|                |               |               |
  |               |                |               |               |
  |-- connect ----→|               |               |               |
  |               |-- create acct →               |               |
  |               |←- account_id --|               |               |
  |               |-- account link→|               |               |
  |←- redirect ---|                |               |               |
  |                                                |               |

Buyer           App             Supabase        Stripe          Resend
  |               |                |               |               |
  |-- /pay/slug --→|               |               |               |
  |               |-- fetch link --→|              |               |
  |←- paywall page|                |               |               |
  |-- pay --------→|               |               |               |
  |               |-- create session ------------->|               |
  |←- redirect ---|                |               |               |
  |-- pays ------->|               |               |               |
  |               |←- webhook -----|               |               |
  |               |-- insert purchase →|           |               |
  |               |-- send email --|               |-------------->|
  |←- unlock email|                |               |               |
  |-- /unlock?token →|             |               |               |
  |               |-- validate ----→|              |               |
  |               |-- mark used ---→|              |               |
  |←- 302 redirect|                |               |               |
  |-- notion.so -->|               |               |               |
```

---

## Data Flow Principles

1. **Supabase** — stores metadata: users, links, purchases, tokens, reports
2. **Stripe** — owns all financial data: payments, payouts, balances, KYC
3. **Resend** — owns email delivery logs
4. **Axiom** — owns application logs (via pino + next-axiom)
5. **Sentry** — owns error events
6. **Amplitude** — owns analytics events

Platform never duplicates data that external services own authoritatively.

---

## Server Actions

Product and checkout flows use Next.js Server Actions (not REST endpoints):

```
createProductAction()        seller creates link
updateProductAction()        seller edits link
createCheckoutSession()      buyer initiates payment
```

## API Routes

```
POST /api/stripe-webhook              Stripe events (4 — see flows.md)
POST /api/connect-stripe              seller initiates Stripe Connect
GET  /api/connect-stripe/return       post-OAuth return handler
GET  /api/connect-stripe/refresh      re-trigger onboarding if expired
POST /api/orders/send-access-link     resend access email to buyer
POST /api/orders/consume-token        mark token used, redirect to delivery URL
GET  /api/orders/[id]/access          validate session + redirect to delivery URL
POST /api/orders/verify               set buyer_session cookie from order token
POST /api/report-abuse                buyer reports product
GET  /api/og/[slug]                   OG image for product paywall links
POST /api/upload-avatar               seller avatar upload
POST /api/upload-preview              product preview image upload
```

---

## Page Routes

```
/                               marketing homepage
/about                          about page

/auth                           magic link login (sellers)
/dashboard                      seller home + onboarding checklist
/dashboard/links/new            create new product
/dashboard/links/[id]           product detail + management
/dashboard/links/[id]/edit      edit product
/dashboard/orders               seller order history
/dashboard/settings             account settings
/onboarding/name                username setup (post-signup)

/@username                      public seller profile
/@username/[slug]               public paywall page (buyer)
/@username/[slug]/success       post-payment confirmation

/orders                         buyer purchase history (cookie-auth)
/orders/[order_id]              buyer order detail
/orders/access                  access token validation + delivery redirect
```
