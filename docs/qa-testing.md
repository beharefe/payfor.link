# QA Testing Guide — unseal.link

> Use this before every staging deploy. Work through Happy Paths first, then Edge Cases.
> Personas: **Seller** (has account), **Buyer** (no account needed), **Visitor** (not logged in).

---

## Setup Checklist

- [ ] Stripe test mode active (`pk_test_...`)
- [ ] Stripe CLI webhook forwarding: `stripe listen --forward-to localhost:3000/api/stripe-webhook`
- [ ] Resend sandbox / real inbox accessible
- [ ] Two browser profiles ready (Seller + Buyer/Incognito)
- [ ] Test card: `4242 4242 4242 4242`, any future date, any CVC

---

## 1. Seller Onboarding

### TC-001: New seller sign-up (happy path)
1. Go to `/auth` as a visitor
2. Enter a valid email → click Send code
3. Check inbox for 6-digit OTP
4. Enter the 6 digits in the split input (2×3)
5. Expected: redirect to `/onboarding/name`
6. Enter a display name (e.g. "Alex Templates") → click **Start selling**
7. Verify:
   - Redirected to `/dashboard`
   - Navbar shows initials avatar
   - Stripe connect banner visible
   - URL slug preview shown while typing name (e.g. `unseal.link/@alex-templates/…`)

### TC-002: Already logged-in seller visits `/auth`
1. Log in as seller
2. Navigate to `/auth`
3. Verify: immediately redirected to `/dashboard` (no auth form shown)

### TC-003: OTP wrong code
1. Go to `/auth`, enter email, submit
2. Enter `000000` (wrong code)
3. Verify: error message shown below button, not above input

### TC-004: OTP resend
1. Go to `/auth`, enter email, submit
2. Wait on OTP screen, click **Resend**
3. Verify: spinner shown during resend, new code arrives in inbox, old code no longer works

### TC-005: Duplicate display name
1. Log in with a second email
2. At `/onboarding/name`, enter the exact name of an existing seller
3. Verify: specific error "That display name is already taken. Try another."

### TC-006: Navbar state — logged out
1. Open homepage in incognito
2. Verify: navbar shows **Start selling** button (not Dashboard)

### TC-007: Navbar state — logged in
1. Log in as seller
2. Navigate to `/` (homepage)
3. Verify: navbar shows **Dashboard** button within ~1 second of page load

---

## 2. Stripe Connect

### TC-008: Connect Stripe (happy path)
1. Log in as seller with no Stripe connected
2. From dashboard, click **Connect Stripe**
3. Complete Stripe Express onboarding with test data
4. Verify after return:
   - Dashboard no longer shows Stripe banner
   - All draft links auto-changed to `active`
   - Seller can now create active links

### TC-009: Stripe connect banner shown on link detail
1. Log in as seller, no Stripe connected
2. Create a link → go to `/dashboard/links/[id]`
3. Verify: "Connect Stripe to activate this link" banner visible

### TC-010: Withdraw funds — KYC not complete
1. Log in as seller with Stripe connected but payouts not enabled
2. Click **Withdraw** on dashboard
3. Verify: redirected to Stripe KYC flow

### TC-011: Withdraw funds — KYC complete
1. Log in as seller with payouts enabled
2. Click **Withdraw**
3. Verify: redirected to Stripe Express dashboard

---

## 3. Link Creation

### TC-012: Create link (happy path)
1. Log in as seller with Stripe connected
2. Go to `/dashboard/links/new`
3. Enter: title, valid HTTPS URL, price $19.99, description
4. Submit
5. Verify:
   - Redirected to link detail page
   - Status badge shows `active`
   - Paywall URL shown with copy + preview buttons

### TC-013: Create link — Stripe not connected
1. Log in as seller with no Stripe connected
2. Create a link
3. Verify:
   - Link created with status `draft`
   - Link detail shows "Connect Stripe to activate" banner

### TC-014: Price below minimum
1. At new link form, enter price `$5.00`
2. Verify: validation error, form not submitted

### TC-015: Invalid / non-HTTPS URL
1. At new link form, enter `http://example.com` or `not-a-url`
2. Verify: validation error shown

### TC-016: Unsafe URL (Google Safe Browsing)
1. Enter a known malicious URL
2. Verify: "This link was flagged as unsafe" error, link not created

### TC-017: Slug uniqueness
1. Create two links with identical titles
2. Verify: both created with different slugs (second has hex suffix)

### TC-018: Edit link
1. Go to `/dashboard/links/[id]/edit`
2. Change title and price
3. Save
4. Verify:
   - Changes reflected on link detail page
   - `version` number incremented

### TC-019: Archive link
1. On link detail, click **Archive**
2. Confirm in modal
3. Verify:
   - Status changes to `archived`
   - Link shows as archived in list
   - Paywall URL returns "No longer available"
4. Click **Unarchive** → verify status returns to `active`

### TC-020: Delete link
1. On link detail, click **Delete**
2. Confirm in modal
3. Verify:
   - Link disappears from links list
   - Direct URL returns 404
   - Cannot be undeleted

---

## 4. Link Preview

### TC-021: Preview draft link (seller)
1. Log in as seller, link in `draft` status
2. On links list, click **Preview**
3. Verify:
   - Preview page loads at `/preview/[id]`
   - "Preview mode" banner visible with status badge showing `draft`
   - Full paywall UI shown (title, price, description, trust row)
   - Pay button is **disabled / greyed out**
   - Edit link in banner works

### TC-022: Preview active link (seller)
1. Log in as seller, link in `active` status
2. Click **Preview**
3. Verify: same as TC-021 but status badge shows `active`

### TC-023: Preview — wrong seller
1. Log in as seller A
2. Manually navigate to `/preview/[id-of-seller-B-link]`
3. Verify: 404 page

### TC-024: Preview — not logged in
1. Open `/preview/[id]` in incognito
2. Verify: redirected to `/auth`

---

## 5. Paywall (Buyer View)

### TC-025: View active paywall (happy path)
1. Open `/@username/slug` in incognito
2. Verify:
   - Product title, description, price shown
   - "Sold by" seller name shown
   - Trust row: Secure / By email / Instant
   - Pay button active
   - Page `<title>` matches product title + price
   - OG image loads at `/api/og/[slug]`

### TC-026: Paywall — draft link (Stripe not connected)
1. Open paywall URL for a draft link
2. Verify:
   - Shows "No longer available"
   - Seller receives missed-sale email within ~5 seconds

### TC-027: Paywall — archived/deleted link
1. Open paywall URL for archived or deleted link
2. Verify: "No longer available" shown, **no** missed-sale email sent

### TC-028: Paywall — expired link
1. Create link with `expires_at` in the past (DB edit)
2. Open paywall URL
3. Verify: "Offer expired" message shown

### TC-029: Paywall — non-existent slug
1. Navigate to `/@validuser/non-existent-slug`
2. Verify: Next.js 404 page

### TC-030: Limited offer badge
1. Create link with `expires_at` 2 hours from now
2. Open paywall
3. Verify: amber "Limited offer · expires in 2 hours" badge shown

---

## 6. Purchase Flow

### TC-031: Complete purchase (happy path)
1. Open active paywall in incognito
2. Click Pay button
3. On Stripe checkout: enter `4242 4242 4242 4242`, future date, any CVC, buyer email
4. Complete payment
5. Verify on success page:
   - Order confirmation shown
   - Buyer email displayed
5. Check buyer inbox:
   - Access link email received
   - Subject: `Your access link: [product title]`
   - "Open link" button present
6. Check seller inbox:
   - Sale notification received
   - Subject: `New sale: [product title]`
   - Shows price paid, platform fee (4.5%), net amount
7. Check Seller dashboard:
   - New order appears in Orders tab
   - Revenue chart updated
   - `total_sales` and `total_earned` incremented

### TC-032: Stripe webhook idempotency
1. Complete a purchase
2. Replay the same webhook event (Stripe dashboard or CLI)
3. Verify: no duplicate order created, no duplicate emails sent

### TC-033: Checkout — product no longer available
1. Start checkout, then archive the product (different tab)
2. Attempt to complete Stripe checkout
3. Verify: error shown "This product is no longer available"

### TC-034: Payment declined
1. Open paywall, click Pay
2. Use card `4000 0000 0000 0002` (declined)
3. Verify: Stripe shows decline error, buyer returned to paywall, no order created

---

## 7. Buyer Access

### TC-035: Access link from email (happy path)
1. After TC-031, open buyer email
2. Click "Open link" button
3. Verify:
   - `buyer_session` cookie set
   - Redirected to delivery URL (the actual product URL)

### TC-036: Access link — already used / expired
1. Click the access link a second time after it's been used
2. Verify: appropriate error (link expired or already used)

### TC-037: Access my orders page
1. Go to `/orders`
2. Enter buyer email used in purchase
3. Check inbox for sign-in link
4. Click sign-in link
5. Verify: orders list shows the purchase

### TC-038: Order detail page — authenticated buyer
1. After signing in to `/orders`, click on an order
2. Verify:
   - Receipt-style layout shown
   - Product title, seller name, amount, date
   - Sale ID (short hash) shown
   - "Open link" button functional
   - "Questions? Contact seller" link present
   - "Report a problem" link present

### TC-039: Order detail page — unauthenticated
1. Open `/orders/[order_id]` directly in incognito (no cookie)
2. Verify: shown "Sign in to view this" with sign-in redirect

### TC-040: Order detail — refunded order
1. After a refund (see TC-047), open the order page
2. Verify: "Order refunded" state shown, no access button

---

## 8. Missed Sale Notification

### TC-041: Missed sale email sent
1. Create a link as seller (no Stripe connected → draft status)
2. Open the paywall URL in incognito as a "buyer"
3. Verify within ~5 seconds:
   - Seller inbox receives missed-sale email
   - Subject: `Someone tried to buy "[title]" — connect Stripe to go live`
   - Email contains product title, seller name, and "Connect Stripe now" CTA button

### TC-042: No missed sale email for non-draft
1. Archive a link
2. Visit the paywall URL
3. Verify: seller does **not** receive missed-sale email

---

## 9. Seller Dashboard

### TC-043: Dashboard overview — empty state
1. Log in as brand-new seller (no links)
2. Verify:
   - Revenue chart shows "No sales yet"
   - "Sell your first link →" button shown in chart
   - Latest links panel shows empty state with "+ New link" button
   - Latest orders panel shows "No orders yet"

### TC-044: Dashboard overview — with data
1. After purchases exist:
2. Verify:
   - Revenue chart shows bars for days with sales
   - Latest links shows up to 5 links with status badges
   - Latest orders shows up to 5 orders with buyer email + amount
   - "All →" links navigate to respective full-list tabs

### TC-045: Dashboard tabs navigation
1. Click each tab: Overview / Links / Orders / Settings
2. Verify:
   - Correct tab highlighted (active state)
   - Links tab stays active on `/dashboard/links/new` and `/dashboard/links/[id]`
   - Correct page content loads with skeleton loading before data appears

### TC-046: Dashboard orders list
1. Go to Orders tab
2. Verify:
   - All orders listed with buyer email, amount, status badge, date
   - Paid orders show refund button (hand-coins icon)
   - Refunded orders show greyed badge

---

## 10. Refunds

### TC-047: Refund order (happy path)
1. On Orders tab or link detail, click refund button (hand-coins icon)
2. Confirm modal shows: buyer email, product name
3. Optionally add a note
4. Click confirm
5. Verify:
   - Order status changes to `refunded`
   - Refund button disappears
   - Stripe dashboard shows refund processed
   - Buyer access link no longer works
   - Order detail page shows "Order refunded"

### TC-048: Refund — already refunded
1. Try to refund an already-refunded order
2. Verify: refund button not shown for refunded orders

---

## 11. Settings

### TC-049: Update display name
1. Go to `/dashboard/settings`
2. Change name to something unique
3. Save
4. Verify: name updated in header avatar, on paywall pages

### TC-050: Update name — already taken
1. Try to set name to an existing seller's name
2. Verify: "That display name is already taken. Try another."

### TC-051: Update avatar
1. Upload a valid JPG/PNG under 2MB
2. Verify: avatar shown in dashboard header and settings

### TC-052: Upload avatar — wrong type
1. Try uploading a `.pdf` or `.gif`
2. Verify: "Only JPG, PNG, or WebP images are allowed"

### TC-053: Upload avatar — too large
1. Try uploading an image over 2MB
2. Verify: "Image must be under 2MB"

---

## 12. Abuse Reporting

### TC-054: Report abuse (buyer)
1. On active paywall, click "Report a problem"
2. Select reason (e.g. scam), add description
3. Submit
4. Verify: success confirmation shown, report saved in `reports` table with status `pending`

### TC-055: Report — missing reason
1. Submit abuse form with no reason selected
2. Verify: 400 error / validation message

---

## 13. Marketing Pages

### TC-056: Homepage CTA — not logged in
1. Visit `/` in incognito
2. Click "Start selling free" CTA
3. Verify: navigated to `/auth`

### TC-057: Homepage CTA — logged in
1. Log in as seller, navigate to `/`
2. Verify: navbar shows "Dashboard" button
3. Click any "Start selling" body CTA
4. Verify: navigated to `/auth` → immediately redirected to `/dashboard`

### TC-058: Pricing page
1. Visit `/pricing`
2. Verify: page loads, fee table visible, CTA present

### TC-059: How it works
1. Visit `/how-it-works`
2. Verify: seller/buyer tabs work, steps shown per tab

---

## 14. Authentication — Edge Cases

### TC-060: Access `/dashboard` not logged in
1. Open `/dashboard` in incognito
2. Verify: redirected to `/auth`

### TC-061: Access `/onboarding/name` not logged in
1. Open `/onboarding/name` in incognito
2. Verify: redirected to `/auth`

### TC-062: Sign out
1. Log in as seller
2. Click Sign out button in dashboard header
3. Verify:
   - Redirected to `/auth`
   - Navigating to `/dashboard` redirects back to `/auth`
   - Navbar shows "Start selling" on homepage

### TC-063: OTP code email subject
1. Trigger OTP send
2. Verify email subject does **not** contain em dashes (`—`) or double dashes (`--`)

---

## 15. Mobile

### TC-064: Paywall on mobile
1. Open paywall URL on iPhone/Android
2. Verify:
   - Card layout fits screen, no horizontal scroll
   - Price, trust row, CTA button all visible without scrolling
   - Pay button tappable

### TC-065: Dashboard on mobile
1. Log in on mobile
2. Verify:
   - Tabs visible and tappable
   - Links list readable
   - Revenue chart renders

### TC-066: OTP input on mobile
1. Open `/auth` on mobile
2. Verify:
   - 6-digit code auto-suggests from SMS/email
   - Split 2×3 input fills correctly
   - Form auto-submits on 6th digit

---

## 16. Seller Public Profile

### TC-067: Public seller profile
1. Visit `/@username`
2. Verify: seller name, active links listed
3. Verify: draft/deleted/archived links **not** shown

---

## Known Limitations (Not Blocking for Staging)

- Terms of Service and Privacy Policy pages are placeholder ("Coming soon")
- `expires_at` and `max_orders` fields are Phase 2 — UI exists but not fully enforced in all paths
- No rate limiting on missed-sale emails (will spam seller if link shared widely while Stripe unconnected)
- Seller public profile page exists but not linked from paywall seller card

---

*Last updated: 2026-03-30*
