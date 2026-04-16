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
Buyer opens /@username/slug
→ fetch product where slug matches AND sellers.username matches AND status = 'active'
→ buyer clicks "Pay $X & Get Access"
→ Server Action: createCheckoutSession()
→ calculateFee(sellerId, amountCents) — applies any active promotions
→ Stripe Checkout session created with:
    application_fee_amount = calculated fee (4.5% minus any active promotions)
    transfer_data.destination = seller.stripe_account_id
    metadata: { product_id, seller_id, promotions_applied, fee_cents }
→ buyer redirected to Stripe hosted checkout
→ buyer enters payment details
→ Stripe processes payment
→ buyer redirected to /@username/slug/success?session_id=xxx
```

---

## 5. Payment Confirmation (Webhook)

```
Stripe fires checkout.session.completed
→ POST /api/stripe-webhook
→ verify Stripe signature
→ check orders.stripe_payment_id (idempotency — skip if exists)
→ fetch product by metadata.product_id
→ read platform_fee from session metadata (set at checkout time — never recalculate)
→ insert order:
    delivery_url = products.destination_url (SNAPSHOT — never read from products again)
    product_title = products.title (SNAPSHOT)
    price_paid = session.amount_total / 100 (SNAPSHOT)
    platform_fee = from session metadata (SNAPSHOT — includes any promotion discount)
    product_version = products.version (SNAPSHOT)
    buyer_email = session.customer_email
    buyer_email_verified = true
    seller_id = products.seller_id
→ rpc try_increment_product_stats(product_id, price_paid) — atomic
    if max_orders exceeded → issue Stripe refund, stop processing
→ rpc increment_seller_stats(seller_id, price_paid, platform_fee)
→ record promotion usage if promotions_applied in metadata
→ generate access token:
    raw = crypto.randomBytes(32).toString('hex')
    hash = sha256(raw)
    insert access_tokens: { order_id, token_hash, expires_at: now + 24h }
→ send access email to buyer via Resend with token URL
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
→ if charges_enabled = true AND welcome_email_sent = false:
    → mark welcome_email_sent = true (before sending — prevents double-send on concurrent webhooks)
    → fetch seller's active promotions
    → send seller welcome email via Resend (from: RESEND_FOUNDER_EMAIL)
        subject: "You're live on unseal.link"
        includes promotions block if seller has active promotions
→ return 200
```

---

## 7. Payment Success Page

```
Buyer lands on /@username/slug/success?session_id=xxx
→ server fetches Stripe session → gets buyer_email + metadata
→ server looks up order by stripe_checkout_session_id
→ if order not yet created (webhook in-flight):
    → client polls via router.refresh() until order appears
→ show purchase confirmation card: product title, amount, email
→ access email already sent by webhook — buyer checks inbox
```

---

## 8. Unlock Flow (email link — sessionless re-access)

```
Buyer clicks link in email: /orders/access?t=abc123&oid=uuid
→ server validates token on GET:
    hash token → sha256(abc123)
    lookup access_tokens by token_hash + order_id
    check: exists / not used / not expired
→ if invalid:        show "Access link is invalid or has expired"
→ if used:           show "Access already used" + "Resend access email →"
→ if expired (>24h): show "Access expired" + "Resend access email →"
→ if valid: show confirmation screen — "Ready to unseal"
    DO NOT consume token on GET
    Email scanners pre-fetch links and would burn the token silently

Buyer clicks "Open link →" button (Server Action):
→ re-validate token
→ mark used_at = now() WHERE used_at IS NULL  (race-condition guard)
→ fetch order.delivery_url
→ 302 redirect → delivery_url
```

---

## 9. Access Email Resend

```
Buyer on expired/used access page clicks "Resend access email →"
→ links to /orders?oid=xxx
→ server fetches order by id
→ generates new access token (raw + SHA-256 hash)
→ inserts access_tokens: { order_id, token_hash, expires_at: now + 24h }
→ sends new access email via Resend with token URL
```

---

## 10. Buyer Orders (cookie-based re-access)

```
Buyer visits /orders
→ no Supabase session required — uses custom HMAC-signed buyer_session cookie
→ Case 1: ?oid=uuid — direct order link (from purchase email or bookmark)
    → fetch order by id, show featured card + other purchases for same email
    → "All purchases for email" link sets session cookie via /api/orders/verify
→ Case 2: ?email=xxx — requires valid buyer_session cookie for that email
    → if no valid session: fall through to email form
    → fetch all orders for email, show most recent as featured card
    → other purchases shown in expandable accordion (click to expand details)
→ Case 3: no params — show email lookup form (OrdersSignIn)

Buyer visits /orders/[order_id]
→ validate buyer_session cookie
→ verify order.buyer_email matches session email (ownership check)
→ show order detail — delivery_url NOT rendered in HTML
→ "Open link →" button → GET /api/orders/[order_id]/access
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
  --events checkout.session.completed,account.updated,charge.dispute.created,charge.refunded

# Production: configure all 4 events in Stripe Dashboard → Webhooks
```

| Event | Handler |
|---|---|
| `checkout.session.completed` | Create order, generate access token, send access email |
| `account.updated` | Sync seller Stripe Connect status (charges/payouts enabled) |
| `charge.dispute.created` | Set order status = 'disputed', alert seller + admin |
| `charge.refunded` | Set order status = 'refunded', reverse promotion usage |

---

## 12. Promotions System

Promotions reduce or eliminate the platform fee for eligible sellers.

### Promotion types

```
fee_waiver_gmv      — waive platform fee up to X in gross sales
                      config: { "waiver_cents": 50000 }
fee_rate_reduction  — reduce fee rate by X basis points for Y days
flat_credit         — add $X credit toward platform fees
feature_unlock      — unlock a feature for Y days
```

### Grant flows

```
Auto-apply on signup:
→ seller completes onboarding
→ grantSignupPromotions(sellerId) called (non-blocking)
→ fetches all active promotions with auto_apply_on_signup = true
→ skips if redemption_count >= max_redemptions
→ inserts seller_promotions row (idempotent — upsert with ignoreDuplicates)
→ increments promotions.redemption_count

Manual code redemption (future UI):
→ seller enters code e.g. "LAUNCH2026"
→ redeemPromotionCode(sellerId, code) looks up by code
→ grants promotion (idempotent — won't double-grant)
```

### Fee calculation at checkout

```
createCheckoutSession() calls calculateFee(sellerId, amountCents)
→ reads seller's active seller_promotions (never cached)
→ applies each active promotion in order
→ stores final fee_cents + promotions_applied[] in Stripe session metadata
→ webhook reads fee from metadata — never recalculates
```

### Usage recording and exhaustion

```
checkout.session.completed webhook:
→ reads promotions_applied from session metadata
→ for each: increments seller_promotions.used_value by GMV amount
→ if used_value >= max_value → status = 'exhausted'

charge.refunded webhook:
→ looks up promotion_usage_log for this payment
→ reverses used_value delta in seller_promotions
→ if status was 'exhausted' → reactivates to 'active'
```

### Dashboard banner

```
getActivePromotionsForSeller(sellerId)
→ queries seller_promotions WHERE status = 'active' AND (expires_at IS NULL OR expires_at > now)
→ PromotionBanners renders per-type UI
→ banner disappears automatically when status = 'exhausted' | 'expired' | 'revoked'
```
