# System Flows

## Overview

Actors: Seller, Buyer, Platform (Next.js), Stripe, Resend, Supabase

Core mechanic: Lock link → Pay → Unlock

---

## 1. Seller Onboarding

```
Seller visits unseal.link
→ enters email → Supabase magic link sent
→ clicks link → authenticated
→ sellers row upserted (id = auth.uid())
→ lands on /dashboard (empty state)
→ clicks "Create link"
```

---

## 2. Create Product

```
Seller fills form: title, description, destination URL, price
→ validate URL format
→ Google Safe Browsing check
→ detect platform (notion/figma/drive/github/other)
→ platform-specific validation (see product-validation.md)
→ auto-generate slug: slugify(title) + "-" + 4-char random hex  e.g. notion-crm-a3f2
→ check slug globally unique → retry with new suffix if collision (max 5 attempts)
→ insert products row:
    status = 'draft' (if Stripe not connected)
    status = 'active' (if Stripe already connected)
→ redirect to /dashboard/links/[id]
```

---

## 3. Stripe Connect — Deferred Onboarding

### Phase A: Connect (minimal friction, no KYC)

```
Seller clicks "Connect Stripe"
→ POST /api/connect-stripe
→ stripe.accounts.create({ type: 'express', email }) if no account yet
→ stripe.accountLinks.create({
    type: 'account_onboarding',
    collect: 'eventually_due'   ← deferred KYC
  })
→ redirect to Stripe
→ seller authorizes (email only, no ID docs)
→ returns to /api/connect-stripe/return
→ stripe.accounts.retrieve() → check charges_enabled
→ update sellers:
    stripe_connected = true
    stripe_charges_enabled = true/false
    stripe_details_submitted = true/false
→ activate all seller's draft products → status = 'active'
→ redirect to /dashboard
```

**Why `eventually_due`**: Sellers have no earnings at signup. Requiring KYC causes dropoffs. Defer to payout time.

### Phase B: Earnings accumulate (no action needed)

```
Buyers pay → checkout.session.completed webhook
→ money held in seller's Stripe connected account
→ platform fee (4.5%) deducted automatically
→ seller sees balance in dashboard (queried from Stripe)
→ payouts_enabled = false until KYC done
```

### Phase C: Withdraw (KYC triggered here)

```
Seller clicks "Withdraw funds"
→ GET stripe.balance.retrieve({ stripeAccount })
→ if payouts_enabled = false:
    → stripe.accountLinks.create({ collect: 'currently_due' })
    → redirect to Stripe KYC
    → seller completes identity + bank account
    → account.updated webhook fires
→ if payouts_enabled = true:
    → Stripe handles payout to bank automatically
    → query stripe.payouts.list() for history display
```

---

## 4. Buyer Purchase Flow

```
Buyer opens /pay/[slug]
→ fetch link where status = 'active'
→ buyer clicks "Pay $X & Get Access"
→ POST /api/create-checkout
→ Stripe Checkout session created with:
    application_fee_amount = price * 0.045
    transfer_data.destination = seller.stripe_account_id
→ buyer redirected to Stripe hosted checkout
→ buyer enters payment details
→ Stripe processes payment
→ buyer redirected to /pay/[slug]/success?session_id=xxx
```

---

## 5. Payment Confirmation (Webhook)

```
Stripe fires checkout.session.completed
→ POST /api/stripe-webhook
→ verify Stripe signature
→ check orders.stripe_payment_id (idempotency — skip if exists)
→ fetch product by metadata.product_id
→ insert order:
    delivery_url = products.destination_url (SNAPSHOT — never read from products again)
    product_title = products.title (SNAPSHOT)
    price_paid = session.amount_total / 100 (SNAPSHOT)
    platform_fee = price_paid * 0.045
    product_version = products.version (SNAPSHOT)
    buyer_email = session.customer_email
    seller_id = products.seller_id
→ rpc increment_product_stats(product_id, price_paid)
→ rpc increment_seller_stats(seller_id, price_paid, platform_fee)
→ generate 6-digit OTP, hash with SHA-256, store in orders.otp_hash (15min expiry)
→ send OTP email to buyer via Resend
    NOTE: access token is NOT generated here — only after OTP verified on success page
→ return 200 immediately
```

**Critical**: Always return 200. Capture errors to Sentry before returning.

---

## 6. Stripe Account Updated (Webhook)

```
Stripe fires account.updated
→ find seller by stripe_account_id
→ update sellers:
    stripe_charges_enabled = account.charges_enabled
    stripe_payouts_enabled = account.payouts_enabled
    stripe_details_submitted = account.details_submitted
→ if payouts_enabled just became true:
    → send seller email: "Identity verified — you can now withdraw"
→ return 200
```

---

## 7. Payment Success + OTP Verification

```
Buyer lands on /pay/[slug]/success?session_id=xxx
→ server fetches Stripe session → gets buyer_email
→ server looks up order by stripe_checkout_session_id
→ if order not yet created (webhook in-flight):
    → client polls every 2s via router.refresh() until order appears
→ if order.buyer_email_verified = true:
    → redirect immediately to /orders/[order_id]  (repeat visit)
→ show OTP input: "Enter the 6-digit code sent to {email}"

verifyOtp(orderId, code):
→ load order, check otp_hash and otp_expires_at
→ hash input code with SHA-256, compare to orders.otp_hash
→ if mismatch or expired: return error message
→ set orders.buyer_email_verified = true, clear otp_hash + otp_expires_at
→ generate access token:
    raw = crypto.randomBytes(32).toString('hex')
    hash = sha256(raw)
    insert access_tokens: { order_id, token_hash, expires_at: now + 24h }
→ send access email via Resend with raw token in URL
→ set purchase_session cookie (scoped to this order)
→ redirect to /orders/[order_id]

resendOtp(orderId):
→ generate new 6-digit OTP, hash with SHA-256
→ update orders.otp_hash + otp_expires_at (15min)
→ send new OTP email via Resend
```

---

## 8. Unlock Flow (email link — sessionless re-access)

```
Buyer clicks link in email: /unlock?token=abc123
→ server validates token on GET:
    hash token → sha256(abc123)
    lookup access_tokens by token_hash
    check: exists / not used / not expired / order not refunded
→ if invalid/used/expired: show error page
→ if valid: show confirmation screen — "You're one click away"
    DO NOT consume token on GET
    Email scanners pre-fetch links and would burn the token silently

Buyer clicks "Access content →" button (form POST via Server Action):
→ re-validate token atomically
→ mark used_at = now() WHERE used_at IS NULL  (race-condition guard)
→ fetch order.delivery_url
→ 302 redirect → delivery_url
```

---

## 9. Token Resend / Expired Flow

```
Buyer clicks "Resend" or visits /unlock-request
→ enters email
→ POST /api/resend-unlock
→ find orders by buyer_email where status = 'paid'
→ rate limit: max 3 active tokens per order per hour
→ for each order:
    invalidate unused tokens
    generate new token
    insert access_tokens
    send unlock email
→ show "Check your inbox"
```

---

## 10. Buyer Orders (cookie-based re-access)

```
Buyer visits /orders
→ no Supabase session required — uses custom HMAC-signed cookie
→ if no orders_session cookie: show email lookup form
→ buyer enters email → POST /api/orders/send-code → OTP sent via Resend
→ buyer enters code → POST /api/orders/verify-code → sets orders_session cookie (1hr)
→ fetch orders WHERE buyer_email = session.email AND status = 'paid'
→ show list: product title, date, amount, "View order →"

Buyer visits /orders/[order_id]
→ validate orders_session or purchase_session cookie
→ verify order.buyer_email matches session email (ownership check)
→ show order detail — delivery_url NOT rendered in HTML
→ "Access content →" button → GET /api/orders/[order_id]/access
    server validates cookie + ownership
    302 redirect → order.delivery_url
```

---

## 11. Abuse Report

```
Buyer clicks "Report" on /pay/[slug]
→ fill reason + optional description
→ POST /api/report-abuse
→ insert reports row
→ admin reviews in moderation queue
→ if confirmed: products.status = 'suspended', notify seller
```

---

## Webhook Events

```bash
# Local dev
stripe listen \
  --forward-to localhost:3000/api/stripe-webhook \
  --events checkout.session.completed,account.updated

# Production: configure both events in Stripe Dashboard → Webhooks
```
