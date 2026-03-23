# Security & Abuse Handling

## Threat Model

| Threat | Risk | Mitigation |
|---|---|---|
| Malware links | Buyer gets infected | Google Safe Browsing on create |
| Scam products | Buyer defrauded | Abuse reporting + moderation |
| Stolen cards | Chargebacks, platform risk | Stripe Radar (built-in) |
| Token sharing | Paid content leaked | Single-use tokens, 24h expiry |
| Duplicate webhooks | Double purchase records | `stripe_payment_id` UNIQUE constraint |
| Webhook spoofing | Fake purchase records | Stripe signature verification |
| Brute force unlocks | Token guessing | 32-byte random tokens = impossible to brute force |
| Email scanner pre-click | Token consumed before buyer | Browser-side confirmation step before consuming token |

---

## Link Safety (On Create)

Every destination URL is checked before a product can go active:

```
1. URL format validation (must be https://)
2. Google Safe Browsing API check
3. Domain blacklist check
4. Platform-specific validation (see product-validation.md)
```

If flagged: `links.status = 'suspended'`, seller notified.

Google Safe Browsing: free, 10K requests/day, sufficient for MVP.

---

## Webhook Security

```typescript
// Always verify Stripe signature — never trust raw payload
const event = stripe.webhooks.constructEvent(
  rawBody,           // must be raw bytes, not parsed JSON
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
)
```

If signature fails → return 400, capture to Sentry, do nothing.

---

## Token Security

```
Raw token: crypto.randomBytes(32).toString('hex')  → 64 char hex string
Stored:    sha256(raw_token)                        → never store raw token
URL:       /unlock?token=<raw_token>
Lookup:    hash incoming token → query by hash
```

Token properties:
- 32 bytes = 256 bits entropy — brute force is computationally impossible
- SHA-256 stored — database leak doesn't expose usable tokens
- Single-use — `used_at` set on first valid use
- 24h expiry — limits exposure window
- Browser confirmation step — prevents email scanner pre-consumption

---

## Stripe Connect Security

- Sellers verified by Stripe (KYC deferred but required for payouts)
- Platform never touches card data — Stripe handles PCI compliance
- Application fee deducted by Stripe automatically — no manual fee logic
- Seller funds held in Stripe — platform never holds money

---

## Abuse Reporting

Every `/pay/[slug]` page has a "Report" link (small, bottom of page).

Report flow:
```
Buyer submits report (reason + description)
→ insert abuse_reports row
→ admin notified (email or Slack webhook)
→ admin reviews in moderation queue
→ if confirmed violation:
    links.status = 'suspended'
    seller notified
→ if repeated violations:
    seller account suspended
    pending payouts reviewed
```

Immediate suspension (no review needed):
- Malware / phishing links
- Illegal content
- Large-scale fraud

---

## Dispute & Chargeback Handling

Stripe handles the financial side automatically.

Platform supports disputes by providing evidence:
- `purchases.created_at` — proof of purchase timestamp
- `unlock_tokens.used_at` — proof of delivery
- `purchases.buyer_email` — proof of who purchased

When `charge.dispute.created` fires (Phase 2 webhook):
- Mark `purchases.status = 'disputed'`
- Alert seller
- Provide evidence to Stripe

---

## RLS (Row Level Security)

All tables have RLS enabled. Key rules:

- **users**: read/update own row only
- **links**: sellers manage own; anyone reads `status = 'active'` only
- **purchases**: sellers see their own sales; buyers via service role only
- **unlock_tokens**: service role only — never client-accessible
- **abuse_reports**: anyone can insert; only service role reads

All sensitive operations (webhook, unlock, resend) use the Supabase secret key (`SUPABASE_SECRET_KEY`, or legacy `SUPABASE_SERVICE_ROLE_KEY`).
Client-side code uses the publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) with RLS enforced. See [Supabase API keys](https://supabase.com/docs/guides/api/api-keys).

---

## Rate Limiting

| Endpoint | Limit |
|---|---|
| POST /api/create-product | 5/day per user |
| POST /api/create-checkout | 10/min per IP |
| POST /api/resend-unlock | 3 resends/purchase/hour |
| POST /api/report-abuse | 5/day per IP |

Implement via Supabase RLS + Vercel Edge middleware or upstash/ratelimit.

---

## DMCA

Copyright complaints: `dmca@unseal.link`
Response time: 24-48 hours
Action: suspend link, notify seller, retain for legal hold

---

## Data Minimization

- Buyer PII stored: email only (no name, no address, no card data)
- Logs: emails masked (`h***@gmail.com`), tokens never logged
- Sentry: no secrets, no full emails, no destination URLs in error context
