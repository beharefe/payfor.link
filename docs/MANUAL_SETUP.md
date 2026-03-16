# Manual setup checklist

After the app is built, complete these steps yourself.

---

## 1. Environment variables

Copy [`.env.example`](../.env.example) to `.env.local` and fill in values.

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → [API Keys](https://supabase.com/docs/guides/api/api-keys) → Publishable key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Same → Secret key (`sb_secret_...`). Keep secret, server-side only. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | Same |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` (local) or Stripe Dashboard → Webhooks (production) |
| `RESEND_API_KEY` | Resend dashboard |
| `RESEND_FROM_EMAIL` | Your verified domain (e.g. noreply@payfor.link) |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. http://localhost:3000 or https://payfor.link) |

Optional:

- `NEXT_PUBLIC_AXIOM_DATASET`, `NEXT_PUBLIC_AXIOM_TOKEN` — Axiom logging
- `NEXT_PUBLIC_AMPLITUDE_API_KEY` — Amplitude analytics
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` — Sentry (run `npx @sentry/wizard@latest -i nextjs`)
- `GOOGLE_SAFE_BROWSING_API_KEY` — Google Safe Browsing API for URL checks

---

## 2. Supabase

1. Run the schema once: Supabase Dashboard → SQL Editor → paste contents of [docs/schema.sql](schema.sql) → Run.
2. Auth: Enable Email provider (Magic link / OTP). Configure email template if you want custom copy.
3. (Optional) Point Auth email to your Resend SMTP in Supabase Auth settings for custom sender.

---

## 3. Stripe

1. Create a Stripe Connect platform (or use existing). Enable Connect and create an Express account for testing.
2. Webhooks:
   - **Local:** Run  
     `stripe listen --forward-to localhost:3000/api/stripe-webhook --events checkout.session.completed,account.updated`  
     and put the printed signing secret into `STRIPE_WEBHOOK_SECRET` in `.env.local`.
   - **Production:** Stripe Dashboard → Webhooks → Add endpoint  
     `https://your-domain.com/api/stripe-webhook`  
     Events: `checkout.session.completed`, `account.updated`  
     Copy the signing secret into your production env as `STRIPE_WEBHOOK_SECRET`.

---

## 4. Resend

1. Verify the domain you use for `RESEND_FROM_EMAIL`.
2. Ensure the API key has send permission.

---

## 5. Sentry (optional)

Run:

```bash
npx @sentry/wizard@latest -i nextjs
```

Add the DSN and auth token to your env.

---

## 6. Smoke test

1. Sign in at `/auth` (magic link).
2. Connect Stripe via dashboard (Connect Stripe).
3. Create a link at `/dashboard/links/new`.
4. Open the paywall URL (`/pay/<slug>`), click Pay, complete checkout with test card `4242 4242 4242 4242`.
5. On `/pay/<slug>/success` enter the OTP from email (or Supabase inbox), verify.
6. Open the unlock link from the second email; confirm redirect to the destination URL.
7. Visit `/library`, sign in with the same buyer email, check “Re-access”.
8. Visit `/unlock-request`, request a new access link by email.

---

## 7. Production deploy (e.g. Vercel)

1. Set all env vars in the project settings.
2. Ensure `NEXT_PUBLIC_APP_URL` is your production URL.
3. Use the production Stripe webhook signing secret (from Stripe Dashboard, not from `stripe listen`).
