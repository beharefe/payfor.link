# Production Launch Checklist

Track each item: `[ ]` → `[x]` when done.

---

## 1. Environment Variables (Vercel)

Set all of these in Vercel → Project → Settings → Environment Variables for **Production**.

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — production Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — `sb_publishable_...` (or legacy anon key)
- [ ] `SUPABASE_SECRET_KEY` — `sb_secret_...` (or legacy service role key)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — live Stripe publishable key (`pk_live_...`)
- [ ] `STRIPE_SECRET_KEY` — live Stripe secret key (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard → Developers → Webhooks (production endpoint)
- [ ] `RESEND_API_KEY` — production Resend API key
- [ ] `RESEND_FROM_EMAIL` — `noreply@unseal.link`
- [ ] `BUYER_SESSION_SECRET` — random 32+ char secret for signing buyer session cookies (generate with `openssl rand -hex 32`)
- [ ] `NEXT_PUBLIC_AXIOM_DATASET` — Axiom dataset name
- [ ] `NEXT_PUBLIC_AXIOM_TOKEN` — Axiom ingest token
- [ ] `NEXT_PUBLIC_AMPLITUDE_API_KEY` — Amplitude project API key
- [ ] `SENTRY_DSN` — Sentry project DSN
- [ ] `SENTRY_AUTH_TOKEN` — Sentry auth token for source maps
- [ ] `GOOGLE_SAFE_BROWSING_API_KEY` — Google Cloud Console → Safe Browsing API
- [ ] `NEXT_PUBLIC_APP_URL` — `https://unseal.link`

---

## 2. Database (Supabase)

- [ ] All tables created in production: `sellers`, `products`, `orders`, `access_tokens`, `reports`
- [ ] `access_tokens` table confirmed present (single-use token system depends on it)
- [ ] RPC functions deployed: `increment_product_stats`, `increment_seller_stats`
- [ ] DB trigger deployed: `products.version` auto-increment on seller edit
- [ ] Row Level Security (RLS) enabled and policies set on all tables
- [ ] Case-insensitive unique index on `sellers.name`:
  ```sql
  CREATE UNIQUE INDEX sellers_name_lower_idx ON sellers (lower(name));
  ```
- [ ] Supabase Auth → Email → OTP Expiry set to match `ACCESS_TOKEN_DAYS` in code (7 days)
- [ ] Supabase Auth → Email templates customised with unseal.link branding (magic link email)
- [ ] Supabase Auth → Redirect URLs: add `https://unseal.link/**`

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

- [ ] Custom SMTP configured in Supabase Auth (Resend, port 465)
- [ ] Test magic-link email delivered successfully via Resend SMTP

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

- [ ] `previews` bucket created in Supabase Storage (public)
- [ ] Storage RLS policies applied (authenticated upload, public read)
- [ ] Test image upload via the create-link form in production

---

## 3. Stripe

- [ ] Switch from test keys (`sk_test_`, `pk_test_`) to live keys (`sk_live_`, `pk_live_`)
- [ ] Create production webhook endpoint: `https://unseal.link/api/stripe-webhook`
- [ ] Register all 3 events on the webhook:
  - `checkout.session.completed`
  - `account.updated`
  - `charge.dispute.created`
- [ ] Copy production `STRIPE_WEBHOOK_SECRET` into Vercel env vars
- [ ] Stripe Connect platform profile complete (business name, URL, support email, icon)
- [ ] Stripe Connect redirect URLs set to production domain
- [ ] Optional: Stripe Dashboard → Settings → Emails → enable "Successful payments" for Stripe's own receipts (buyers get both Stripe receipt + our access link email)

---

## 4. Resend (Email)

- [ ] Domain `unseal.link` verified in Resend (DNS records: SPF, DKIM, DMARC)
- [ ] `noreply@unseal.link` confirmed as sending address
- [ ] `info@unseal.link` inbox confirmed (receives abuse reports + dispute alerts)
- [ ] Send a test email to verify delivery in production

---

## 5. Monitoring

- [ ] **Axiom**: create dataset, add ingest token to env vars, confirm logs flowing
- [ ] **Amplitude**: create project, add API key, confirm `paywall_viewed` event tracked
- [ ] **Sentry**: create project, add DSN + auth token, confirm errors captured
- [ ] **Sentry**: set up alerts for critical errors (webhook failures, payment errors)
- [ ] **Google Safe Browsing**: enable API in Google Cloud Console, add key to env vars

---

## 6. Security

- [ ] `BUYER_SESSION_SECRET` is a strong random value (≥32 chars), not reused from dev
- [ ] All Supabase RLS policies verified — buyers cannot read other buyers' orders
- [ ] Stripe webhook signature verification confirmed working (returns 400 on bad signatures)
- [ ] No `.env` or secrets committed to git (`git log --all --full-history -- .env`)
- [ ] Vercel preview deployments restricted to team only (not publicly accessible)

---

## 7. QA — Remaining "Can't Test" Items

These require a public staging or production URL (not Vercel-auth-protected):

- [ ] TC-006: Navbar state — logged-out visitor sees "Start selling"
- [ ] TC-024: Preview page — not logged in redirects to /auth
- [ ] TC-025: View active paywall as anonymous buyer
- [ ] TC-039: Order detail — unauthenticated redirects correctly
- [ ] TC-040: Refunded order shows correct state to buyer
- [ ] TC-041: Missed sale email fires when draft link visited
- [ ] TC-042: No missed sale email for active links
- [ ] TC-062: Sign out works correctly
- [ ] TC-064: Paywall on mobile (real device)
- [ ] TC-065: Dashboard on mobile (real device)
- [ ] TC-066: OTP input on mobile (real device)
- [ ] TC-067: Public seller profile page `/@username`
- [ ] End-to-end: purchase → single-use access link → confirm consumed on second click
- [ ] End-to-end: refund → buyer email received → seller email received
- [ ] End-to-end: abuse report → `info@unseal.link` alert received
- [ ] End-to-end: Stripe test dispute → order marked `disputed` → emails received

---

## 8. Legal & Privacy (GDPR)

- [ ] `/privacy` page written and live — must cover:
  - What data you collect (email, purchase history)
  - Why (contract performance — delivering purchased content)
  - Who you share it with (Stripe, Supabase, Resend, Amplitude, Axiom, Sentry)
  - How long you keep it
  - How to request deletion (email: info@unseal.link)
- [ ] `/terms` page written and live — cover: acceptable use, no refund policy exceptions, platform fees, seller responsibilities
- [ ] Both pages linked in site footer
- [ ] Stripe Dashboard → Settings → Business → add `https://unseal.link/privacy` and `https://unseal.link/terms` (shown on Stripe-hosted pages)
- [ ] Stripe checkout `after_submit` text already links to both ✓ (done in code)

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

- [ ] Decide: Option A (disable cookies, no banner) or Option B (banner)
- [ ] If Option A: update `src/lib/amplitude.tsx` to add `cookieOptions: { disable: true }`
- [ ] If Option B: add consent banner before EU launch

---

## 9. Pre-Launch Polish


- [ ] `NEXT_PUBLIC_APP_URL` set to `https://unseal.link` (affects OG images, access links, email links)
- [ ] OG image endpoint (`/api/og/[slug]`) tested at production domain
- [ ] Custom domain configured in Vercel and DNS propagated
- [ ] `sitemap.xml` and `robots.txt` verified (Next.js generates these from `app/sitemap.ts` / `app/robots.ts` if present — add if missing)
- [ ] Privacy policy and Terms pages reviewed for accuracy (`/privacy`, `/terms`)
- [ ] Google Safe Browsing tested with a known-safe URL (verify it doesn't block valid links)
- [ ] Test Stripe Connect onboarding flow on production (deferred KYC path)
- [ ] Confirm seller KYC → `account.updated` webhook fires → `stripe_charges_enabled` synced → draft links activate

---

## 10. Post-Launch

- [ ] Monitor Axiom logs for errors in first 24h
- [ ] Monitor Sentry for any unexpected crashes
- [ ] Verify Amplitude events are recording (`paywall_viewed`, `purchase_completed`)
- [ ] Check Stripe dashboard for first real payment
- [ ] Confirm first access link email delivered to real buyer
