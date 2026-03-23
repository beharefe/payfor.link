# MVP Gap Plan — unseal.link

What exists, what's missing, exact files to build.
Updated: 2026-03-23

---

## Current State

### ✅ Done and working

| Area | Files |
|---|---|
| Auth (magic link + OTP) | `src/app/(auth)/auth/page.tsx`, `auth/confirm/route.ts`, `actions/auth.ts` |
| Create product | `actions/product.ts`, `dashboard/links/new/` |
| Stripe Connect (deferred KYC) | `actions/stripe-connect.ts`, `api/connect-stripe/**` |
| Paywall page | `(buyer)/pay/[slug]/page.tsx`, `paywall-cta.tsx` |
| Stripe Checkout | `actions/checkout.ts` |
| Webhook handler | `api/stripe-webhook/route.ts` — creates purchase, increments stats, sends OTP |
| OTP verify + unlock token | `actions/otp.ts` |
| Success page + poller | `pay/[slug]/success/page.tsx`, `success-page-client.tsx` |
| Buyer orders | `(buyer)/orders/page.tsx`, `orders/[order_id]/page.tsx` |
| Secure access redirect | `api/orders/[order_id]/access/route.ts` |
| Unlock page (confirmation gate) | `(buyer)/unlock/page.tsx` |
| Unlock resend | `(buyer)/unlock-request/`, `api/resend-unlock/route.ts` |
| Seller dashboard (list) | `(seller)/dashboard/page.tsx` |
| Seller link detail | `(seller)/dashboard/links/[id]/page.tsx` |
| Real-time new order toast | `(seller)/dashboard/realtime-notifier.tsx` |
| Middleware (auth gate) | `src/middleware.ts` — guards `/dashboard` + `/orders` |

---

## ❌ MVP Gaps — Must Fix Before Launch

### GAP 1 — Homepage is empty
**File**: `src/app/(marketing)/page.tsx` — currently `return null`
**Also empty**: `(marketing)/how-it-works/page.tsx`, `(marketing)/pricing/page.tsx`

Minimum homepage content:
- Hero: headline + sub + CTA (→ /auth)
- How it works: 3 steps (Paste link · Set price · Get paid)
- Fee line: "We take 4.5%. You keep the rest."
- Social proof placeholder (can be "Join X sellers" even if X = 0)

Pricing page: just one tier for now — "Free · 4.5% per sale · No monthly fee"

How it works: expand the 3-step flow with platform examples (Notion, Figma, Drive, GitHub)

---

### GAP 2 — No seller "new sale" email
**File**: `src/app/api/stripe-webhook/route.ts`

`handleCheckoutSessionCompleted` currently:
1. ✅ Creates purchase
2. ✅ Increments link + seller stats
3. ✅ Sends OTP to buyer
4. ❌ Does NOT notify seller

Add after the OTP send:
```ts
// Notify seller of new sale
const { data: seller } = await supabase
  .from("users")
  .select("email, name")
  .eq("id", link.seller_id)
  .single();

if (seller?.email) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: seller.email,
    subject: `New sale — ${link.title}`,
    html: `
      <p>You just made a sale 🎉</p>
      <p><strong>${link.title}</strong> — $${pricePaid.toFixed(2)}</p>
      <p>Buyer: ${customerEmail}</p>
      <a href="${appUrl}/dashboard">View your dashboard →</a>
    `,
  });
}
```

---

### GAP 3 — Success page has no product context
**File**: `src/app/(buyer)/pay/[slug]/success/page.tsx`

Currently shows "Verify your email" with just the email address.
Buyer doesn't know what they just bought or how much they paid.

The `purchase` row already has `product_title` and `price_paid`.
Add above the OTP form:
```
✅ Payment confirmed
[Product Title]
$XX.XX
Enter the 6-digit code sent to email@...
```

Change the `select` in the purchase query to include `product_title, price_paid, currency`.

---

### GAP 4 — Link detail page has a typo in the back link
**File**: `src/app/(seller)/dashboard/links/[id]/page.tsx` line ~35

```tsx
// current — wrong
<Link href="/dashboard">← Studio</Link>

// fix
<Link href="/dashboard">← Dashboard</Link>
```

---

### GAP 5 — Supabase SMTP not configured
**Not a code change — infrastructure config.**

Go to Supabase → Authentication → Email Templates → SMTP Settings.
Set custom SMTP using Resend:
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: your Resend API key
- From: `noreply@unseal.link`

Without this, OTP emails come from `noreply@mail.supabase.io` — different domain from unlock emails, looks sketchy, likely to hit spam.

---

### GAP 6 — Schema migration not applied
**Not a code change — run in Supabase SQL Editor.**

```sql
-- 1. Fix slug uniqueness
ALTER TABLE links DROP CONSTRAINT links_seller_id_slug_key;
ALTER TABLE links ADD CONSTRAINT links_slug_key UNIQUE (slug);

-- 2. Add missing total_paid_out column
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_paid_out numeric(10,2) NOT NULL DEFAULT 0;
```

---

### GAP 7 — Abuse report on paywall page
**File**: `src/app/(buyer)/pay/[slug]/page.tsx`
**New file**: `src/app/(buyer)/pay/[slug]/abuse-report-form.tsx`
**New route**: `src/app/api/report-abuse/route.ts`

Add a small "Report this link" text link at the bottom of the paywall page.
Clicking opens an inline form: reason dropdown + optional description → POST to `/api/report-abuse`.
No auth required. Inserts into `abuse_reports` table.

---

### GAP 8 — Settings page is empty
**File**: `src/app/(seller)/dashboard/settings/page.tsx` — currently `return null`

MVP minimum: let seller update their `name` (shown on paywall page as "by {name}").
Just a form with one field, server action updates `users.name`.

---

## ⚠️ Near-MVP Polish (do before first real users, not strictly blocking)

### POLISH 1 — Dashboard back link says "Studio" (already caught in GAP 4)

### POLISH 2 — Dashboard earnings shows DB total, not live Stripe balance
**File**: `src/app/(seller)/dashboard/page.tsx`

Currently: `total_earned - total_fees` from the `users` table.
Better for launch: query `stripe.balance.retrieve({}, { stripeAccount })` and show the real number.
The DB total is fine as a fallback when not connected.

### POLISH 3 — Unlock email HTML is very minimal
**File**: `src/app/actions/otp.ts`

The unlock email sent via Resend is a single `<p>` tag.
Minimum: add product title, price paid, clear CTA button, expiry warning.

### POLISH 4 — OG tags on paywall page need `generateMetadata`
**File**: `src/app/(buyer)/pay/[slug]/page.tsx`

Currently no dynamic OG tags. Shared links on Twitter/Discord show blank previews.
Add `generateMetadata` with `og:title`, `og:description`, `og:image` (use `preview_image_url` or fallback), `twitter:card`.
This is the #1 distribution multiplier — every shared link becomes a rich preview card.

### POLISH 5 — `next-intl` installed but almost unused
`messages/en.json` has 2 placeholder strings. Either remove `next-intl` entirely or
wire it up. Dead dependency adds config noise. Easiest: remove it unless i18n is day-1.

---

## Build Order for Launch

Strict priority order:

```
1. GAP 4  — fix "← Studio" typo              (5 min)
2. GAP 2  — seller new sale email             (20 min)
3. GAP 3  — success page product context      (15 min)
4. GAP 7  — abuse report on paywall           (45 min)
5. GAP 8  — settings page (name field)        (20 min)
6. GAP 1  — homepage + pricing + how-it-works (2-3 hrs)
7. POLISH 4 — OG tags on paywall page         (30 min)
8. POLISH 3 — unlock email HTML               (20 min)
── then stop and get first users ──
9. GAP 5  — SMTP config (Supabase dashboard)
10. GAP 6  — schema migration (Supabase SQL)
```

Items 9 and 10 are infrastructure config steps, not code — do them against the real Supabase project when deploying.

---

## What Intentionally Stays Out of MVP

These are real features but not needed to get first paying users:

- Stripe live balance on dashboard (DB total is sufficient)
- Payout history table
- Seller weekly digest email
- Refund flow (seller-initiated)
- Preview image upload
- Amplitude / Sentry setup (wire up after first traffic)
- SEO landing pages (`/sell-notion-template` etc)
- Rate limiting (Upstash) — Stripe + Supabase handle most abuse at this scale
- Dispute/chargeback webhook handler
- Custom slugs
- Expiring links
- Purchase limits
- Seller public profile (`/[username]`)
