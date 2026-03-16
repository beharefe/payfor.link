# Database & External Data Relationships

## Core Principle

Platform stores only metadata. External services own their data.

| Data | Stored Where |
|---|---|
| Seller identity | Supabase + Stripe |
| Payment records | Stripe (query via API) |
| Payout records | Stripe (query via API — no local copy) |
| Product metadata | Supabase |
| Purchase snapshots | Supabase |
| Unlock tokens | Supabase |
| Auth sessions | Supabase Auth |
| Emails sent | Resend |

---

## Entity Relationships

```
users (sellers)
  ├── links (products) — one seller has many links
  │     └── purchases — one link has many purchases
  │           └── unlock_tokens — one purchase has many tokens
  └── purchases — seller_id denormalized for fast dashboard queries

abuse_reports → links (many reports per link)
```

---

## External Service Bindings

```
users.id → auth.users.id (Supabase Auth)
users.stripe_account_id → Stripe Connect Express account
purchases.stripe_payment_id → Stripe PaymentIntent or Checkout Session
purchases.stripe_checkout_session_id → Stripe Checkout Session
```

---

## Supabase Auth Flow

```
seller visits /auth
→ enters email
→ Supabase sends magic link
→ seller clicks link → auth.users row created automatically
→ app upserts row in users table (id = auth.uid())
→ seller lands on /dashboard
```

Buyers never have Supabase accounts. Identified by email only.

---

## Stripe Data — Query Don't Store

### Payouts
Never store in DB. Always query Stripe:
```typescript
const payouts = await stripe.payouts.list(
  { limit: 20 },
  { stripeAccount: seller.stripe_account_id }
)
```

### Balance
```typescript
const balance = await stripe.balance.retrieve(
  { stripeAccount: seller.stripe_account_id }
)
// balance.available[0].amount = withdrawable amount in cents
// balance.pending[0].amount = pending (not yet settled)
```

### Why not store locally:
- Stripe is always accurate — your DB can drift
- Stripe has full history with failure reasons, bank details, arrival dates
- Zero sync bugs, zero migrations

---

## Resend Data

Resend stores email delivery logs. No need to mirror in Supabase.
Use Resend dashboard to debug delivery issues.

---

## Key Query Patterns

### Paywall page load
```sql
SELECT l.*, u.name as seller_name
FROM links l
JOIN users u ON u.id = l.seller_id
WHERE l.slug = $1 AND l.status = 'active'
LIMIT 1
```

### Webhook idempotency check
```sql
SELECT id FROM purchases
WHERE stripe_payment_id = $1
LIMIT 1
```

### Buyer library
```sql
SELECT p.*, l.title as current_title
FROM purchases p
JOIN links l ON l.id = p.link_id
WHERE p.buyer_email = $1
ORDER BY p.created_at DESC
```

### Seller dashboard stats
```sql
SELECT
  COUNT(*) as total_sales,
  SUM(price_paid) as gross_revenue,
  SUM(platform_fee) as total_fees,
  SUM(price_paid - platform_fee) as net_revenue
FROM purchases
WHERE seller_id = $1 AND status = 'paid'
```

### Token validation
```sql
SELECT t.*, p.delivery_url, p.product_title
FROM unlock_tokens t
JOIN purchases p ON p.id = t.purchase_id
WHERE t.token_hash = $1
  AND t.expires_at > now()
  AND t.used_at IS NULL
LIMIT 1
```

---

## RLS Summary

| Table | Rule |
|---|---|
| users | Select/update own row only |
| links | Sellers manage own; public reads `status = active` |
| purchases | Sellers see own sales; buyers via service role only |
| unlock_tokens | Service role only — never expose to client |
| abuse_reports | Anyone can insert; service role reads |

---

## Triggers

### `set_updated_at()`
Fires on UPDATE for: `users`, `links`, `purchases`
Sets `updated_at = now()` automatically.

### `increment_link_version()`
Fires on UPDATE for: `links`
Increments `version` only when seller-editable fields change:
`title`, `description`, `destination_url`, `price`, `cta_text`, `preview_image_url`

Status changes (suspend/delete) do NOT increment version.
