# Database & External Data Relationships

## Core Principle

Platform stores only metadata. External services own their data.

| Data | Stored Where |
|---|---|
| Seller identity | Supabase + Stripe |
| Payment records | Stripe (query via API) |
| Payout records | Stripe (query via API — no local copy) |
| Product metadata | Supabase |
| Order snapshots | Supabase |
| Access tokens | Supabase |
| Auth sessions | Supabase Auth |
| Emails sent | Resend |

---

## Entity Relationships

```
sellers
  ├── products — one seller has many products
  │     └── orders — one product has many orders
  │           └── access_tokens — one order has many tokens
  └── orders — seller_id denormalized for fast dashboard queries

reports → products (many reports per product)
```

---

## External Service Bindings

```
sellers.id → auth.users.id (Supabase Auth)
sellers.stripe_account_id → Stripe Connect Express account
orders.stripe_payment_id → Stripe PaymentIntent
orders.stripe_checkout_session_id → Stripe Checkout Session
```

---

## Supabase Auth Flow

```
seller visits /auth
→ enters email
→ Supabase sends magic link OTP
→ seller enters 6-digit code → auth.users row created automatically
→ app upserts row in sellers table (id = auth.uid())
→ seller lands on /dashboard
```

Buyers never have Supabase accounts. Identified by email only.
Buyer sessions use HMAC-signed cookies (`orders_session`, `purchase_session`).

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
SELECT p.*, s.name as seller_name
FROM products p
JOIN sellers s ON s.id = p.seller_id
WHERE p.slug = $1 AND p.status = 'active'
LIMIT 1
```

### Webhook idempotency check
```sql
SELECT id FROM orders
WHERE stripe_payment_id = $1
LIMIT 1
```

### Buyer order library
```sql
SELECT o.*, p.title as current_title
FROM orders o
JOIN products p ON p.id = o.product_id
WHERE o.buyer_email = $1
ORDER BY o.created_at DESC
```

### Seller dashboard stats
```sql
SELECT
  COUNT(*) as total_sales,
  SUM(price_paid) as gross_revenue,
  SUM(platform_fee) as total_fees,
  SUM(price_paid - platform_fee) as net_revenue
FROM orders
WHERE seller_id = $1 AND status = 'paid'
```

### Token validation
```sql
SELECT t.*, o.delivery_url, o.product_title
FROM access_tokens t
JOIN orders o ON o.id = t.order_id
WHERE t.token_hash = $1
  AND t.expires_at > now()
  AND t.used_at IS NULL
LIMIT 1
```

---

## RLS Summary

| Table | Rule |
|---|---|
| sellers | Select/update own row only |
| products | Sellers manage own; public reads `status = active` |
| orders | Sellers see own sales; buyers via service role only |
| access_tokens | Service role only — never expose to client |
| reports | Anyone can insert; service role reads |

---

## Triggers

### `set_updated_at()`
Fires on UPDATE for: `sellers`, `products`, `orders`
Sets `updated_at = now()` automatically.

### `increment_product_version()`
Fires on UPDATE for: `products`
Increments `version` only when seller-editable fields change:
`title`, `description`, `destination_url`, `price`, `cta_text`, `preview_image_url`

Status changes (suspend/delete) do NOT increment version.
