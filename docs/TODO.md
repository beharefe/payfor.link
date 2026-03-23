# unseal.link — TODO

Last updated: 2026-03-23

---

## 🚨 Pre-Launch Blockers

These must ship before the product goes live.

### 1. Supabase SMTP → Resend
Currently Supabase sends OTP emails from its own domain, and Resend sends unlock emails.
Two different senders from two different domains = buyer confusion + spam risk.
Fix: configure Supabase custom SMTP to use Resend so all emails come from `noreply@unseal.link`.
Docs: https://supabase.com/docs/guides/auth/auth-smtp

### 2. Homepage (`/`)
Nothing exists. Can't launch without a landing page.
Must include: hero, how it works (3 steps), fee line (4.5%), CTA → /auth.

### 3. Seller "new sale" email
Sellers get a real-time toast on the dashboard — but only if they're on it.
Most of the time they're not. Every `checkout.session.completed` should fire an email to the seller via Resend:
> "You just made a sale — {buyer_email} bought {product_title} for ${price_paid}"

### 4. Schema migration (slug constraint)
DB currently has `UNIQUE(seller_id, slug)`. Code generates globally unique slugs.
Run in Supabase SQL Editor:
```sql
ALTER TABLE links DROP CONSTRAINT links_seller_id_slug_key;
ALTER TABLE links ADD CONSTRAINT links_slug_key UNIQUE (slug);
```

### 5. Seller activation moment (`/studio/links/[id]`)
After creating a link, seller lands on this page. It should be the "🎉 moment":
- Big headline: "Your paywall is ready"
- Large copy-link button (the primary action)
- Share prompts: Twitter · Discord · Email
- Stripe connect banner if not yet connected
- Edit / Archive / Delete actions
Currently this page exists but is a plain detail view.

### 6. Abuse report on paywall page
Every `/pay/[slug]` needs a small "Report" link at the bottom.
Modal: reason dropdown (scam / malware / copyright / other) + optional description.
Inserts into `abuse_reports`. No auth required.

---

## 🔧 Technical Debt

### 7. Architecture doc stale
`docs/architecture.md` still shows old routes (`/library`, `/dashboard`, `/create`, `/product/[id]`).
Also shows webhook flow sending unlock email directly (should be OTP, then unlock after verify).
Update the routes list and sequence diagrams.

### 8. Delivery doc stale
`docs/delivery.md` references `/library` for re-access. Update to `/orders`.
Also update the sequence: buyer clicks confirmation button before token is consumed (not on GET).

### 9. `total_paid_out` column missing from schema
`CLAUDE.md` and `docs/revenue.md` reference `users.total_paid_out` for balance calculation:
`available = total_earned - total_fees - total_paid_out`
Column is not in `docs/schema.sql`. Add it.
```sql
ALTER TABLE users ADD COLUMN total_paid_out numeric(10,2) NOT NULL DEFAULT 0;
```

### 10. next-intl — remove or use properly
`next-intl` is installed and configured but `messages/en.json` only has two placeholder strings.
Either wire it up properly or remove it — dead dependency adds build weight and config noise.

### 11. OTP columns in purchases table are dead weight
`otp_code_hash`, `otp_expires_at`, `otp_attempts` exist on `purchases` but are never used
(Supabase Auth handles OTP natively). Remove from schema and docs if not needed.

---

## 🛠 Phase 2 (after first users)

### 12. Success page: show product context
The OTP form currently has no context about what was just purchased.
Show product title + price above the OTP input so buyers aren't confused.

### 13. Seller dashboard: Stripe balance (live)
Currently shows `total_earned - total_fees` from DB.
Should query `stripe.balance.retrieve({ stripeAccount })` for the real-time available balance.
DB totals are useful for display but Stripe is the source of truth.

### 14. Payout history on dashboard
`stripe.payouts.list({}, { stripeAccount })` — show a table of past payouts with date + amount.

### 15. Seller new sale email: include delivery context
Beyond just notifying of a sale, include:
- link to `/studio` to see full sales history
- reminder that the buyer has 24h to use their unlock link

### 16. `/studio/settings`
Seller can update their name (used on paywall page as "by {name}").
Phase 2: avatar, bio, custom payout schedule.

### 17. Buyer refund flow
Seller-initiated via dashboard. Button on each purchase row.
Calls Stripe refund API → sets `purchases.status = 'refunded'`.
Buyer loses access (unlock tokens and /orders/[id] both check status).

### 18. Preview image on paywall page
`links.preview_image_url` column exists. Wire up upload (Supabase Storage) + display on paywall.
This significantly improves OG tag richness for social sharing.

---

## 📈 Phase 3 (post-traction)

### 19. SEO landing pages
`/sell-notion-template`, `/sell-figma-template`, `/monetize-google-drive` etc.
Static or ISR pages targeting long-tail creator queries. See `docs/seo.md`.

### 20. Analytics setup (Amplitude)
`docs/analytics.md` is fully specced. 6 events: `paywall_viewed`, `signup`, `product_created`,
`checkout_started`, `payment_success`, `unlock_success`. Wire them up once traffic starts.

### 21. Sentry setup
`docs/error-tracking.md` covers this. Run `npx @sentry/wizard@latest -i nextjs`.
Wrap webhook handler in try/catch → Sentry.captureException before returning 200.

### 22. Expiring links
`links.expires_at` column exists. Add UI toggle for sellers + check on paywall load.

### 23. Purchase limits
`links.max_purchases` column exists. Enforce check in checkout action.

### 24. Seller public profile
`users.username`, `users.avatar_url`, `users.bio` columns exist. Build `/[username]` page.

### 25. Charge.dispute webhook
Handle `charge.dispute.created`:
- Set `purchases.status = 'disputed'`
- Alert seller by email
- Provide evidence object to Stripe

### 26. Rate limiting (Upstash)
See `docs/security.md` rate limit table. Add `@upstash/ratelimit` to:
- `POST /api/create-checkout` (10/min per IP)
- `POST /api/resend-unlock` (3/purchase/hour)
- `POST /api/report-abuse` (5/day per IP)

---

## 💡 Ideas / Nice-to-Have

### 27. Auto-redirect after OTP verify (optional UX improvement)
After OTP verify on success page, we redirect to `/orders/[id]` which requires one more click
("Access content →"). Consider: auto-redirect to delivery URL after a 2s "✅ Verified" animation.
The `/orders/[id]` page remains as a re-access path. First-time experience gets faster.

### 28. "Powered by unseal.link" on paywall page
Small badge at the bottom. Organic growth loop. Should be opt-out, not opt-in.

### 29. Seller email: weekly earnings digest
Simple weekly cron: total sales this week, total revenue, top product.

### 30. Duplicate link
Sellers want to create variations of the same product (different price points).
"Duplicate" button on `/studio/links/[id]` that pre-fills the create form.
