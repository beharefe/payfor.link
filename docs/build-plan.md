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

See [docs/schema.md](schema.md) for the full SQL. Table names:

| Table | Purpose |
|---|---|
| `sellers` | Seller accounts (FK → auth.users) |
| `products` | Paywall links |
| `orders` | Immutable purchase snapshots |
| `access_tokens` | Single-use unlock tokens (24h) |
| `reports` | Abuse reports |

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
- Middleware protects `/dashboard` (seller) and `/orders` (buyer) routes

---

### Step 3 — Create Product
**Pages**: `/dashboard/links/new`
**Actions**: `createProduct()`
**Logic**:
- Validate URL format
- Google Safe Browsing check
- Detect platform from domain (notion/figma/drive/github/other) → auto-set `product_type`
- Auto-generate slug: `slugify(title) + "-" + crypto.randomBytes(2).toString("hex")` → e.g. `notion-crm-a3f2`
  - Globally unique — check `products.slug` without seller filter, retry up to 5× with new suffix
- Insert `products` row with `status = 'draft'`
- If seller `stripe_connected = true` → set `status = 'active'` immediately
- Redirect to `/dashboard/links/[id]` — the activation/copy-link moment

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
**Pages**: `/dashboard` (seller home), `/dashboard/links/[id]` (link detail)
**Logic (`/dashboard/links/[id]` — the activation moment)**:
- Show "🎉 Your paywall is ready" hero section
- Large copy-link button — this is the primary CTA on this page
- Share prompt: "Share on Twitter · Discord · Email"
- Stripe connect CTA if not connected
- Edit / Archive / Delete actions

**Logic (`/dashboard`)**:
- Fetch seller's products + per-product stats
- Show total earnings (query Stripe balance)
- "Withdraw funds" button
- "Copy URL" on each product row — most-used action
- Real-time new order toast (Supabase Realtime `orders` INSERT → `router.refresh()` + toast)

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
→ redirect to /dashboard
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
→ check orders.stripe_payment_id (idempotency — skip if exists)
→ fetch product (for snapshot)
→ insert order:
    buyer_email, stripe_payment_id, stripe_checkout_session_id
    delivery_url (snapshot), product_title (snapshot)
    price_paid (snapshot), platform_fee (price * 0.045)
    product_version (snapshot), seller_id, product_id
→ rpc increment_product_stats(product_id, price_paid)
→ rpc increment_seller_stats(seller_id, price_paid, platform_fee)
→ generate 6-digit OTP → SHA-256 hash → store in orders.otp_hash (15min expiry)
→ send OTP email to buyer via Resend
→ return 200
-- NOTE: access token is NOT generated here — only after buyer verifies OTP on success page
```

**Event: `account.updated`**:
```
verify Stripe signature
→ find seller by stripe_account_id
→ update sellers:
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

**Custom OTP** (not Supabase Auth) is used for buyer email verification:
- **Webhook**: after creating the order, generate a 6-digit OTP, SHA-256 hash it, store in `orders.otp_hash` with 15min expiry, and send to buyer via Resend.
- **Success page**: buyer enters the code; we hash the input and compare to `orders.otp_hash`. On success we clear the hash, set `buyer_email_verified = true`, create the access token, and send the access email via Resend.
- **Resend code**: generate a new OTP, update `orders.otp_hash` + `otp_expires_at`, send fresh email via Resend.

**Logic**:
- Read `session_id` from URL params
- Fetch Stripe session → get `customer_email`
- Show OTP input: "Enter the 6-digit code we sent to {email}"
- `verifyOtp(orderId, code)`:
  ```
  → load order by id, check otp_hash and otp_expires_at
  → hash input code with SHA-256, compare to orders.otp_hash
  → if mismatch or expired: return error
  → set buyer_email_verified = true, clear otp_hash + otp_expires_at
  → generate access token (32 bytes → sha256 → store in access_tokens)
  → send access email via Resend
  → set purchase_session cookie (scoped to order)
  → redirect to /orders/[orderId]
  ```
- `resendOtp(orderId)`:
  ```
  → generate new 6-digit OTP, hash with SHA-256
  → update orders.otp_hash + otp_expires_at (15min)
  → send new OTP email via Resend
  ```
- After successful verify → redirect to `/orders/[orderId]`
- If order not yet created (webhook in-flight): client polls every 2s (`SuccessPoller`) until order appears, then shows OTP form

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

### Step 11 — Buyer Orders (cookie-based)
**Pages**: `/orders` (list), `/orders/[order_id]` (detail)
**API**: `GET /api/orders/[order_id]/access`, `POST /api/orders/send-code`, `POST /api/orders/verify-code`, `GET /api/orders/lookup`
**Logic**:
- No Supabase session required — uses custom HMAC-signed cookies
- `/orders`: if no `orders_session` cookie → show email lookup + OTP form; on verify → set `orders_session` cookie → fetch orders WHERE buyer_email = session.email AND status = 'paid'
- `/orders/[id]`: validate `orders_session` or `purchase_session` cookie + ownership check
  - `delivery_url` is NEVER rendered in HTML
- "Access content →" → `GET /api/orders/[order_id]/access`
  - Server validates cookie + ownership → 302 to `order.delivery_url`
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

1. **Always use `order.delivery_url`** — never `products.destination_url` for delivery
2. **Webhook must be idempotent** — check `orders.stripe_payment_id` before inserting
3. **Return 200 to Stripe immediately** — capture errors to Sentry, never let webhook timeout
4. **Never expose `access_tokens` to client** — service role only
5. **`products.version` increments automatically** via DB trigger on seller edits
6. **Snapshot `product_version` in order** — know which version was bought
7. **Slug lookups always filter `status = 'active'`** — never serve draft/suspended
8. **Deferred KYC** — only trigger when seller requests payout, never at signup
