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
→ users row upserted (id = auth.uid())
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
→ insert links row:
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
→ update users:
    stripe_connected = true
    stripe_charges_enabled = true/false
    stripe_details_submitted = true/false
→ activate all seller's draft links → status = 'active'
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
→ check purchases.stripe_payment_id (idempotency — skip if exists)
→ fetch link by metadata.link_id
→ insert purchase:
    delivery_url = links.destination_url (SNAPSHOT — never read from links again)
    product_title = links.title (SNAPSHOT)
    price_paid = session.amount_total / 100 (SNAPSHOT)
    platform_fee = price_paid * 0.045
    link_version = links.version (SNAPSHOT)
    buyer_email = session.customer_email
    seller_id = links.seller_id
→ UPDATE links SET total_sales++, total_revenue += price_paid
→ UPDATE users SET total_earned += price_paid, total_fees += platform_fee
→ supabase.auth.signInWithOtp({ email: buyer_email })
    Supabase sends 6-digit OTP to buyer — this is the verification step
    NOTE: unlock token is NOT generated here — only after OTP verified on success page
→ return 200 immediately
```

**Critical**: Always return 200. Capture errors to Sentry before returning.

---

## 6. Stripe Account Updated (Webhook)

```
Stripe fires account.updated
→ find user by stripe_account_id
→ update:
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
→ server looks up purchase by stripe_checkout_session_id
→ if purchase not yet created (webhook in-flight):
    → client polls every 2s via router.refresh() until purchase appears
→ if purchase.buyer_email_verified = true:
    → redirect immediately to /orders/[purchase_id]  (repeat visit)
→ show OTP input: "Enter the 6-digit code sent to {email}"

verifyOtp(purchase_id, code):
→ supabase.auth.verifyOtp({ email: buyer_email, token: code, type: 'email' })
→ if error: return error message
→ set purchase.buyer_email_verified = true
→ generate unlock token:
    raw = crypto.randomBytes(32).toString('hex')
    hash = sha256(raw)
    insert unlock_tokens: { purchase_id, token_hash, expires_at: now + 24h }
→ send unlock email via Resend with raw token in URL
→ redirect to /orders/[purchase_id]

resendOtp(purchase_id):
→ supabase.auth.signInWithOtp({ email: purchase.buyer_email })
→ Supabase enforces rate limits + expiry
```

---

## 8. Unlock Flow (email link — sessionless re-access)

```
Buyer clicks link in email: /unlock?token=abc123
→ server validates token on GET:
    hash token → sha256(abc123)
    lookup unlock_tokens by token_hash
    check: exists / not used / not expired / purchase not refunded
→ if invalid/used/expired: show error page
→ if valid: show confirmation screen — "You're one click away"
    DO NOT consume token on GET
    Email scanners pre-fetch links and would burn the token silently

Buyer clicks "Access content →" button (form POST via Server Action):
→ re-validate token atomically
→ mark used_at = now() WHERE used_at IS NULL  (race-condition guard)
→ fetch purchase.delivery_url
→ 302 redirect → delivery_url
```

---

## 9. Token Resend / Expired Flow

```
Buyer clicks "Resend" or visits /unlock-request
→ enters email
→ POST /api/resend-unlock
→ find purchases by buyer_email where status = 'paid'
→ rate limit: max 3 active tokens per purchase per hour
→ for each purchase:
    invalidate unused tokens
    generate new token
    insert unlock_tokens
    send unlock email
→ show "Check your inbox"
```

---

## 10. Buyer Orders (session-based re-access)

```
Buyer visits /orders
→ middleware checks Supabase session
→ if no session: redirect to /auth (magic link / OTP sign-in)
→ fetch purchases WHERE buyer_email = user.email AND status = 'paid'
→ show list: product title, date, amount, "View order →"

Buyer visits /orders/[order_id]
→ middleware guards route (session required)
→ verify purchase.buyer_email = user.email (ownership check)
→ show order detail — delivery_url NOT rendered in HTML
→ "Access content →" button → GET /api/orders/[order_id]/access
    server validates session + ownership
    302 redirect → purchase.delivery_url
```

---

## 11. Abuse Report

```
Buyer clicks "Report" on /pay/[slug]
→ fill reason + optional description
→ POST /api/report-abuse
→ insert abuse_reports row
→ admin reviews in moderation queue
→ if confirmed: links.status = 'suspended', notify seller
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
