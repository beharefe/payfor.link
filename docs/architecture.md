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
Browser → POST /api/create-product
  → Supabase: insert products row
  → Google Safe Browsing: validate URL
  ← return { slug, paywall_url }
```

### Buyer pays
```
Browser → POST /api/create-checkout
  → Stripe: create Checkout Session
  ← return { url }
Browser → redirect to Stripe hosted checkout
Stripe → POST /api/stripe-webhook (checkout.session.completed)
  → Supabase: insert orders row
  → Resend: send OTP email to buyer
  ← 200 OK
Browser → /pay/[slug]/success
```

### Buyer unlocks
```
Email link → GET /unlock?token=xxx
  → Supabase: validate access_tokens
  → mark token used
  ← 302 redirect → delivery_url (e.g. notion.so/template)
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

## API Routes

```
POST /api/create-product          seller creates link
POST /api/create-checkout         buyer initiates payment
POST /api/stripe-webhook          Stripe events (checkout.completed, account.updated)
POST /api/connect-stripe          seller initiates Stripe Connect
GET  /api/connect-stripe/return   post-OAuth return handler
GET  /api/connect-stripe/refresh  re-trigger onboarding if expired
POST /api/resend-unlock           resend unlock email
POST /api/report-abuse            buyer reports product
GET  /api/purchases               seller fetches their sales
```

---

## Page Routes

```
/                           marketing homepage
/how-it-works               education page
/pricing                    fee structure

/auth                       magic link login (sellers)
/dashboard                  seller home
/create                     create new product
/product/[id]               product detail + management
/settings                   account settings

/pay/[slug]                 public paywall page (buyer)
/pay/[slug]/success         post-payment confirmation
/unlock                     token validation + redirect
/unlock-request             request new unlock link
/library                    buyer purchase history
```
