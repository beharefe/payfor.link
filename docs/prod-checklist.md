# Production Launch Checklist

Track each item: `[ ]` → `[x]` when done.

---

## 1. Environment Variables (Vercel)

Set all of these in Vercel → Project → Settings → Environment Variables for **Production**.

- [x] `NEXT_PUBLIC_SUPABASE_URL` — production Supabase project URL
- [x] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — `sb_publishable_...` (or legacy anon key)
- [x] `SUPABASE_SECRET_KEY` — `sb_secret_...` (or legacy service role key)
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — live Stripe publishable key (`pk_live_...`)
- [x] `STRIPE_SECRET_KEY` — live Stripe secret key (`sk_live_...`)
- [x] `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard → Developers → Webhooks (production endpoint)
- [x] `RESEND_API_KEY` — production Resend API key
- [x] `RESEND_FROM_EMAIL` — `noreply@unseal.link`
- [x] `BUYER_SESSION_SECRET` — random 32+ char secret for signing buyer session cookies (generate with `openssl rand -hex 32`)
- [x] `NEXT_PUBLIC_AXIOM_DATASET` — Axiom dataset name
- [x] `NEXT_PUBLIC_AXIOM_TOKEN` — Axiom ingest token
- [x] `NEXT_PUBLIC_AMPLITUDE_API_KEY` — Amplitude project API key
- [x] `SENTRY_DSN` — Sentry project DSN
- [x] `SENTRY_AUTH_TOKEN` — Sentry auth token for source maps
- [x] `NEXT_PUBLIC_APP_URL` — `https://unseal.link`

---

## 2. Database (Supabase)

- [x] All tables created in production: `sellers`, `products`, `orders`, `access_tokens`, `reports`
- [x] `access_tokens` table confirmed present (single-use token system depends on it)
- [x] RPC functions deployed: `increment_product_stats`, `increment_seller_stats`
- [x] DB trigger deployed: `products.version` auto-increment on seller edit
- [x] Row Level Security (RLS) enabled and policies set on all tables
- [x] Case-insensitive unique index on `sellers.name`:
  ```sql
  CREATE UNIQUE INDEX sellers_name_lower_idx ON sellers (lower(name));
  ```
### Required indexes

Run these in **Supabase Dashboard → SQL Editor** before launch:

```sql
-- Fast seller dashboard queries
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id   ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at DESC);

-- Paywall page load (slug + seller join)
CREATE INDEX IF NOT EXISTS idx_products_slug   ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Expiry badge / Limited offer queries
CREATE INDEX IF NOT EXISTS idx_products_expires_at ON products(expires_at)
  WHERE expires_at IS NOT NULL;

-- Access token lookup (critical path — every buyer access)
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_tokens_token_hash ON access_tokens(token_hash);
CREATE INDEX        IF NOT EXISTS idx_access_tokens_order_id   ON access_tokens(order_id);

-- Webhook idempotency check
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_payment_id ON orders(stripe_payment_id);
```

- [x] All indexes above created in production

---

- [x] Supabase Auth → Email → OTP Expiry set to match `ACCESS_TOKEN_DAYS` in code (7 days)
- [ ] Supabase Auth → Email templates customised with unseal.link branding (magic link email)
- [ ] Supabase Auth → Redirect URLs: add `https://unseal.link/**`
- [ ] Supabase SMTP configured to use Resend (https://supabase.com/docs/guides/auth/auth-smtp)
- [ ] Supabase Bucket public (preview-images) configured for file storage (https://supabase.com/docs/guides/storage) 

### Supabase SMTP — use Resend instead of the default mailer

By default Supabase uses a shared low-volume SMTP service that rate-limits at ~3 emails/hour — **not suitable for production**. Replace it with Resend before launch.

1. Go to **Supabase Dashboard → Project → Authentication → SMTP Settings**
2. Enable **Custom SMTP**
3. Fill in:
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL) or `587` (STARTTLS)
   - **Username:** `resend`
   - **Password:** your Resend API key (`re_...`)
   - **Sender name:** `unseal.link`
   - **Sender email:** `noreply@unseal.link` (must match a verified Resend domain)
4. Send a test email from the Supabase UI to confirm delivery
5. Verify magic-link emails arrive promptly from `noreply@unseal.link`

- [x] Custom SMTP configured in Supabase Auth (Resend, port 465)
- [x] Test magic-link email delivered successfully via Resend SMTP

### Supabase Storage — preview image uploads

The `/api/upload-preview` endpoint requires a Supabase Storage bucket.

1. Go to **Supabase Dashboard → Storage**
2. Create a new bucket called **`previews`**
3. Set it to **Public** (images are served directly on paywall pages)
4. Add a storage policy to allow authenticated sellers to upload:
   ```sql
   -- Allow authenticated users to insert into previews bucket
   CREATE POLICY "Sellers can upload previews"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'previews');

   -- Allow public read
   CREATE POLICY "Public read previews"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'previews');
   ```
5. Optionally set a **file size limit** (2 MB) and allowed MIME types (`image/jpeg`, `image/png`, `image/webp`) in the bucket settings
6. Confirm the bucket URL matches what `upload-preview` returns — typically `https://<project>.supabase.co/storage/v1/object/public/previews/<filename>`

- [x] `preview-images` bucket created in Supabase Storage (public)
- [x] Storage RLS policies applied (authenticated upload, public read)
- [x] Test image upload via the create-link form in production

---

## 3. Stripe

- [x] Switch from test keys (`sk_test_`, `pk_test_`) to live keys (`sk_live_`, `pk_live_`)
- [x] Create production webhook endpoint: `https://unseal.link/api/stripe-webhook`
- [x] Register all 3 events on the webhook:
  - `checkout.session.completed`
  - `account.updated`
  - `charge.dispute.created`
- [x] Copy production `STRIPE_WEBHOOK_SECRET` into Vercel env vars
- [x] Stripe Connect platform profile complete (business name, URL, support email, icon)
- [x] Stripe Connect redirect URLs set to production domain
- [x] Optional: Stripe Dashboard → Settings → Emails → enable "Successful payments" for Stripe's own receipts (buyers get both Stripe receipt + our access link email)

---

## 4. Resend (Email)

- [x] Domain `unseal.link` verified in Resend (DNS records: SPF, DKIM, DMARC)
- [x] `noreply@unseal.link` confirmed as sending address
- [x] `info@unseal.link` inbox confirmed (receives abuse reports + dispute alerts)
- [x] Send a test email to verify delivery in production

---

## 5. Monitoring

- [x] **Axiom**: create dataset, add ingest token to env vars, confirm logs flowing
- [x] **Amplitude**: create project, add API key, confirm `paywall_viewed` event tracked
- [x] **Sentry**: create project, add DSN + auth token, confirm errors captured
- [x] **Sentry**: set up alerts for critical errors (webhook failures, payment errors)
- [?] **Google Safe Browsing**: enable API in Google Cloud Console, add key to env vars

---

## 6. Security

- [x] `BUYER_SESSION_SECRET` is a strong random value (≥32 chars), not reused from dev
- [x] All Supabase RLS policies verified — buyers cannot read other buyers' orders
- [x] Stripe webhook signature verification confirmed working (returns 400 on bad signatures)
- [x] No `.env` or secrets committed to git (`git log --all --full-history -- .env`)
- [x] Vercel preview deployments restricted to team only (not publicly accessible)

---

## 7. QA — Remaining "Can't Test" Items

These require a public staging or production URL (not Vercel-auth-protected):

- [x] TC-006: Navbar state — logged-out visitor sees "Start selling"
- [x] TC-024: Preview page — not logged in redirects to /auth
- [x] TC-025: View active paywall as anonymous buyer
- [x] TC-039: Order detail — unauthenticated redirects correctly
- [x] TC-040: Refunded order shows correct state to buyer
- [x] TC-041: Missed sale email fires when draft link visited
- [x] TC-042: No missed sale email for active links
- [x] TC-062: Sign out works correctly
- [x] TC-064: Paywall on mobile (real device)
- [x] TC-065: Dashboard on mobile (real device)
- [x] TC-066: OTP input on mobile (real device)
- [x] TC-067: Public seller profile page `/@username`
- [x] End-to-end: purchase → single-use access link → confirm consumed on second click
- [x] End-to-end: refund → buyer email received → seller email received
- [x] End-to-end: abuse report → `info@unseal.link` alert received
- [x] End-to-end: Stripe test dispute → order marked `disputed` → emails received

---

## 8. Legal & Privacy (GDPR)

- [x] `/privacy` page written and live — must cover:
  - What data you collect (email, purchase history)
  - Why (contract performance — delivering purchased content)
  - Who you share it with (Stripe, Supabase, Resend, Amplitude, Axiom, Sentry)
  - How long you keep it
  - How to request deletion (email: info@unseal.link)
- [x] `/terms` page written and live — cover: acceptable use, no refund policy exceptions, platform fees, seller responsibilities
- [x] Both pages linked in site footer
- [x] Stripe Dashboard → Settings → Business → add `https://unseal.link/privacy` and `https://unseal.link/terms` (shown on Stripe-hosted pages)
- [x] Stripe checkout `after_submit` text already links to both ✓ (done in code)

### Amplitude — Cookie Consent
Amplitude uses cookies for session tracking which requires consent under GDPR/ePrivacy for EU visitors.

**Option A — Disable cookies (recommended for MVP, zero friction)**
In your Amplitude init config, set:
```ts
amplitude.init(API_KEY, { defaultTracking: true, cookieOptions: { disable: true } })
```
This switches Amplitude to localStorage only — no consent banner needed. You lose cross-domain tracking but that's fine for this product.

**Option B — Consent banner (do later, when real EU traffic warrants it)**
Use a library like `cookie-consent` or `CookieYes`. Only initialise Amplitude after consent is given.

- [x] Decide: Option A (disable cookies, no banner) or Option B (banner)
- [x] If Option A: update `src/lib/amplitude.tsx` to add `cookieOptions: { disable: true }`
- [?] If Option B: add consent banner before EU launch

---

## 9. Pre-Launch Polish


- [x] `NEXT_PUBLIC_APP_URL` set to `https://unseal.link` (affects OG images, access links, email links)
- [x] OG image endpoint (`/api/og/[slug]`) tested at production domain
- [x] Custom domain configured in Vercel and DNS propagated
- [x] `sitemap.xml` and `robots.txt` verified (Next.js generates these from `app/sitemap.ts` / `app/robots.ts` if present — add if missing)
- [x] Privacy policy and Terms pages reviewed for accuracy (`/privacy`, `/terms`)
- [x] Google Safe Browsing tested with a known-safe URL (verify it doesn't block valid links)
- [x] Test Stripe Connect onboarding flow on production (deferred KYC path)
- [x] Confirm seller KYC → `account.updated` webhook fires → `stripe_charges_enabled` synced → draft links activate

---

## 10. Post-Launch

- [x] Monitor Axiom logs for errors in first 24h
- [x] Monitor Sentry for any unexpected crashes
- [x] Verify Amplitude events are recording (`paywall_viewed`, `purchase_completed`)
- [x] Check Stripe dashboard for first real payment
- [x] Confirm first access link email delivered to real buyer
