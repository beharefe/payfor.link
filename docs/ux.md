# payfor.link — UX Document

## Design Philosophy

WeTransfer-inspired: one thing per screen, massive whitespace, zero chrome, total focus on the task. No decorative elements. No marketing noise on functional pages. Every pixel either moves the user through the flow or gets removed.

**Mantra**: If you can delete it, delete it.

---

## Design System

### Colors

WeTransfer palette — adapted for both modes.

#### Light Mode

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#F5F4EF` | Page background (WeTransfer warm off-white) |
| `--surface` | `#FFFFFF` | Cards, modals, inputs |
| `--text-primary` | `#111111` | Headings, labels |
| `--text-secondary` | `#6B6B6B` | Descriptions, meta |
| `--text-muted` | `#AAAAAA` | Placeholders, hints |
| `--accent` | `#111111` | Primary CTA button (black pill) |
| `--accent-fg` | `#FFFFFF` | CTA button text |
| `--border` | `#E5E5E5` | Input borders, dividers |
| `--success` | `#1A7A4A` | Success states, unlock confirmed |
| `--success-bg` | `#EDFBF4` | Success banners |
| `--error` | `#C0392B` | Errors |
| `--error-bg` | `#FDF2F2` | Error banners |

#### Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#111111` | Page background |
| `--surface` | `#1C1C1C` | Cards, modals, inputs |
| `--text-primary` | `#F5F4EF` | Headings, labels |
| `--text-secondary` | `#999999` | Descriptions, meta |
| `--text-muted` | `#555555` | Placeholders, hints |
| `--accent` | `#F5F4EF` | Primary CTA button (cream pill) |
| `--accent-fg` | `#111111` | CTA button text |
| `--border` | `#2C2C2C` | Input borders, dividers |
| `--success` | `#2ECC71` | Success states |
| `--success-bg` | `#0D2A1A` | Success banners |
| `--error` | `#E74C3C` | Errors |
| `--error-bg` | `#2A0D0D` | Error banners |

---

### Typography

**Font**: `DM Sans` — geometric, warm, modern. Used by Notion's marketing. Closer to WeTransfer's feel than Inter.

```css
font-family: 'DM Sans', sans-serif;
```

| Scale | Size | Weight | Usage |
|---|---|---|---|
| Display | 48px / 56px lh | 500 | Hero headline |
| H1 | 32px / 40px lh | 500 | Page titles |
| H2 | 22px / 30px lh | 500 | Section headers |
| Body | 16px / 24px lh | 400 | Descriptions, text |
| Small | 14px / 20px lh | 400 | Labels, meta |
| Micro | 12px / 16px lh | 400 | Legal, hints |

**Rule**: No bold except CTA labels and prices. Weight contrast replaces color contrast.

---

### Spacing

8px base grid. Page max-width: `640px` centered. All content single-column.

```
4px   — icon gap, badge padding
8px   — inline spacing
16px  — component internal padding
24px  — between related elements
40px  — between sections
80px  — page top padding (mobile: 48px)
```

---

### Components

#### Primary Button (CTA)
```
background: var(--accent)
color: var(--accent-fg)
border-radius: 100px (full pill)
padding: 14px 28px
font-size: 16px
font-weight: 500
width: 100% on mobile
hover: opacity 0.88, translateY(-1px)
transition: 180ms ease-out
```

#### Input
```
background: var(--surface)
border: 1.5px solid var(--border)
border-radius: 12px
padding: 14px 16px
font-size: 16px
focus: border-color var(--text-primary), no box-shadow glow
```

#### Card
```
background: var(--surface)
border: 1px solid var(--border)
border-radius: 16px
padding: 24px
```

#### Price Badge
```
font-size: 32px
font-weight: 500
color: var(--text-primary)
```

#### Trust Line (under CTA)
```
font-size: 13px
color: var(--text-muted)
text-align: center
"Secured by Stripe · payfor.link takes 4.5%"
```

---

### Motion

```css
--transition-fast: 150ms ease-out;   /* hover states */
--transition-base: 220ms ease-out;   /* page transitions */
--transition-slow: 350ms ease-out;   /* success animations */
```

Success checkmark: scale 0 → 1 at 350ms spring. Subtle only — no confetti, no fireworks.

---

## Pages

---

## 1. Marketing Homepage `/`

**Goal**: One sentence explains it. One CTA. Done.

### Layout

```
[Navbar: logo left | "Sign in" right — minimal, no links]

[Hero: centered, max-width 560px]

  Sell any link.
  Instantly.

  [subtext: Paste a link, set a price, share. Buyers pay and get access.]

  [ Start selling free → ]   ← full-width pill button on mobile

  [trust line: "No storefront. No platform fees until you sell."]

[How it works — 3 steps, horizontal on desktop, vertical on mobile]

  01  Paste your link
  02  Set a price
  03  Share & get paid

[Social proof — if available: "Used by X creators · $Y paid out"]

[Footer: minimal — Terms · Privacy · How it works]
```

### Design Notes
- Background `--bg` (warm off-white). No hero image, no illustration.
- The headline is the only large element on the page. Everything else is quiet.
- Zero animations except button hover. Page loads instantly.
- Mobile: all elements stack, single column, 20px horizontal padding.

---

## 2. How It Works `/how-it-works`

Simple educational page. Three sections: Sellers, Buyers, Pricing.

```
[H1: How payfor.link works]

[For sellers]
  Step 1 — Create an account (magic link, no password)
  Step 2 — Paste your link and set a price
  Step 3 — Connect Stripe to receive payouts
  Step 4 — Share your paywall link anywhere

[For buyers]
  Open the link
  Pay via Stripe
  Check email
  Click unlock → access content instantly

[Pricing]
  We take 4.5% per sale.
  Stripe processing fees apply (~2.9% + $0.30).
  No monthly fees. No setup costs.
  You only pay when you earn.
```

---

## 3. Pricing `/pricing`

One-pager. Three paragraphs max.

```
[H1: Simple pricing]

[Large text: 4.5% per sale]

[Body: No monthly fees. No setup. No surprises.
You keep 95.5% of every sale, minus Stripe's payment processing fee (~2.9% + $0.30 per transaction).]

[Example table:]

  Sale price   You receive
  $10          ~$8.62
  $25          ~$22.26
  $100         ~$92.03

[CTA: Start selling →]
```

---

## 4. Auth — Sign Up / Sign In `/auth`

**Identical page for both**. Email-only. No password field ever.

```
[Top: Logo centered]

[Card, centered, max-width 400px]

  [H2: Enter your email]

  [subtext: We'll send you a magic link to sign in.]

  [Input: your@email.com]

  [ Continue → ]

  [Micro: By continuing, you agree to our Terms of Service.]
```

### States

**After submit:**
```
  ✉ Check your email
  We sent a link to hello@example.com
  It expires in 15 minutes.
  [Resend link]
```

### Design Notes
- Page background `--bg`. Card on `--surface`.
- No "Login / Register" tab toggle. Same screen handles both — Supabase magic link creates account if it doesn't exist.
- No social login in MVP. Keeps it clean.

---

## 5. Create Product `/create`

**Seller only (authenticated).**

Two inputs. One button. That's the whole page.

```
[Navbar: logo left | "Dashboard" right]

[H1: Create a paywall link]

[Form, max-width 560px, centered]

  [Label: What are you selling?]
  [Input: e.g. Notion CRM Template]

  [Label: Description  (optional)]
  [Textarea: Tell buyers what they're getting... — 3 lines, resizable]

  [Label: Destination link]
  [Input: https://notion.so/your-template]
  [Validation hint: We'll check this link can be duplicated]

  [Label: Price]
  [Price presets: $9.99 · $19 · $29 · $49]  ← quick-select buttons, clicking fills the input
  [Input: $ ___  — numeric, min $9.99]

  [ Create paywall link → ]

  [Micro: You'll connect Stripe before going live.]
```

### Validation State (inline, not blocking)
```
  ✅ notion.so — Notion template detected. Duplication check passed.
  ⚠️  figma.com — Make sure view access is enabled for buyers.
  ❌  Link is private or unreachable. Check sharing settings.
```

### Design Notes
- No steps wizard. No progress bar. Just a clean form.
- Price input shows `$` prefix inline, no separate label clutter.
- Validation runs on blur (when user leaves the URL field), not on every keystroke.
- After submit → redirect to `/product/[id]` with success toast.

---

## 6. Product Detail (Seller View) `/product/[id]`

Post-creation confirmation and management screen. First thing seller sees after creating.
This is the **activation moment** — seller must feel "I can use this right now."

```
[Navbar: logo | Dashboard]

[Status badge: DRAFT or ACTIVE — small pill, top right of card]

[Card]

  [H2: Notion CRM Template]
  [Price: $19]
  [Description: one line preview]

  [Section: 🎉 Your paywall is ready]   ← celebratory, prominent
  [URL display: payfor.link/pay/notion-crm-template  |  Copy]
  [Share prompt: Share this on Twitter · Discord · Email · Anywhere]

  [Section: Stripe]
  [If not connected:]
    ⚠️  Connect Stripe to start selling
    [ Connect Stripe → ]
  [If connected:]
    ✅  Stripe connected · payouts enabled

  [Divider]

  [Stats row: 0 sales · $0 earned]

  [Actions row: Edit  ·  Archive  ·  Delete]
```

### Design Notes
- **Copy link is the hero action** — large, prominent, one click. This is the "aha moment."
- URL displayed in a monospace-ish input-style box with one-click copy + "Copied!" feedback.
- Share prompt is plain text, not buttons — keeps it light.
- Stripe connection CTA is the only blocker shown if not connected.
- "Archive" replaces soft-delete — seller stops selling but keeps analytics.
- Deleting shows a confirmation dialog: "Existing buyers will keep their access."

---

## 7. Seller Dashboard `/dashboard`

Minimal. One number front and center.

```
[Navbar: logo | + New link | Account]

[Hero stat]
  [Large: $0.00]
  [Subtext: total earned]

[Section: Your links]

  [If no links: empty state]
    Create your first paywall link.
    [ + Create link ]

  [If links exist: table/list]
    [Row per product:]
      [Title]  [Price]  [Sales count]  [Revenue]  [Status pill]  [Copy URL]

[Section: Recent sales — if any]
  [Row per sale:]
    [Product name]  [buyer email masked: h***@gmail.com]  [amount]  [date]
```

### Design Notes
- Single column on mobile. Table on desktop.
- Status pills: ACTIVE (black), DRAFT (grey), SUSPENDED (red).
- No charts in MVP. Just numbers.
- "Copy URL" on each row — most used action.

---

## 8. Paywall / Buy Page `/pay/[slug]`

**The most critical page. Buyer's first impression.**

Zero distractions. One job: pay.

```
[No navbar. No footer. Full page centered card.]

[Top: "payfor.link" wordmark — small, centered, linked to homepage]

[Card, max-width 480px, centered vertically on desktop]

  [Seller name + avatar placeholder: "by @username"]

  [H1: Notion CRM Template]

  [Price: $19]  ← large, prominent

  [Description: 2–3 lines max. Truncate with "Read more" if longer.]

  [ Pay $19 & Get Access → ]   ← full width, pill

  [Trust line: 🔒 Secured by Stripe · Instant delivery by email]

  [Payment icons: Visa / MC / Apple Pay / Google Pay — small, greyscale]

  [Divider]

  [Micro: You'll receive an email with your access link immediately after payment.
   Questions? Contact the seller.]

  [Report abuse — tiny link, bottom of card]
```

### States

**If link is SUSPENDED or ARCHIVED or DELETED:**
```
  [H2: This product is unavailable]
  [Subtext: It may have been removed by the seller.]
```

### Mobile Layout
- Card fills full width with 16px padding.
- Price and CTA are above the fold always.
- "Pay & Get Access" button is 56px height minimum for thumb tap target.

### Design Notes
- No navigation. No logo link. No escape hatches.
- Background is `--bg`. Card is `--surface` with subtle shadow.
- Seller name shown without avatar in MVP (no upload yet).
- Stripe Checkout opens as redirect, not modal (simpler, more trusted).

### OG / SEO Metadata (critical for sharing on Twitter, Slack, Discord, iMessage)

```typescript
// app/pay/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const link = await getLinkBySlug(params.slug)
  if (!link) return {}

  return {
    title: `${link.title} — $${link.price}`,
    description: link.description ?? `Pay once and get instant access to ${link.title}.`,
    openGraph: {
      title: `${link.title} — $${link.price}`,
      description: link.description ?? `Pay once and get instant access.`,
      url: `https://payfor.link/pay/${link.slug}`,
      siteName: 'payfor.link',
      images: link.preview_image_url
        ? [{ url: link.preview_image_url, width: 1200, height: 630 }]
        : [{ url: 'https://payfor.link/og-default.png', width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${link.title} — $${link.price}`,
      description: link.description ?? `Pay once and get instant access.`,
      images: link.preview_image_url
        ? [link.preview_image_url]
        : ['https://payfor.link/og-default.png'],
    },
    other: {
      'product:price:amount': String(link.price),
      'product:price:currency': link.currency.toUpperCase(),
    }
  }
}
```

**Default OG image** (`/og-default.png`): static 1200×630 image with payfor.link branding.
Used for links without a `preview_image_url`. Design it once, use everywhere.

OG tags make shared links show rich previews on: Twitter/X, Slack, Discord, Telegram, iMessage, LinkedIn.
This is the #1 distribution multiplier — costs nothing to implement.

---

## 9. Payment Success / Check Email `/pay/[slug]/success`

Post-Stripe-redirect landing page.

```
[No navbar]

[Centered, max-width 480px]

  [✅ checkmark animation — grows in at 350ms]

  [H2: You're in!]

  [Body: We sent your access link to]
  [buyer@email.com]  ← displayed from Stripe session

  [Subtext: Check your inbox — it usually arrives within 30 seconds.
   If you don't see it, check your spam folder.]

  [Resend email — text link, small]

  [Divider]

  [Micro: Didn't get it after 2 minutes?
   Enter your email below to resend.]

  [Input: Email address]
  [ Resend access link ]
```

### Design Notes
- No upsell. No "share this product." No distractions.
- The email confirmation is the deliverable. Focus there entirely.
- Checkmark animation is the only motion on the page.

---

## 10. Unlock Email (Transactional)

Sent by Resend after `checkout.session.completed`.

```
Subject: Your access link — [Product Title]

---

Hi,

You purchased [Product Title] for $[price].

[ Access your purchase → ]   ← large CTA button

This link expires in 24 hours and can only be used once.
If it expires, visit payfor.link/unlock-request to get a new one.

---
Order: #[purchase_id]
Date: [date]
Amount: $[amount]

Questions? Reply to this email.

payfor.link
```

### Design Notes
- Plain design. Dark text on white. No decorative images.
- One button. One job.
- Reply-to should route to a support inbox, not a no-reply.
- SPF, DKIM, DMARC configured on sending domain — critical for deliverability.

---

## 11. Unlock / Delivery Page `/unlock?token=abc123`

After clicking the email link.

### Token Valid State
```
[No navbar]

[Centered, max-width 480px]

  [✅ Purchase verified]

  [H2: Notion CRM Template]
  [Seller: by @username]

  [Body: Here's your access link:]

  [Big CTA: Open [Platform] →]   e.g. "Open Notion →"

  [Secondary: Copy link — text button]

  [Divider]

  [Micro: Purchased on [date] · Order #[id]]
  [Micro: Bought this for someone else? Forward them this page URL.]
```

### Token Expired / Used State
```
  [⏱ This link has expired]

  [Body: Unlock links expire after 24 hours for security.]

  [Input: Your purchase email]
  [ Send new access link → ]
```

### Token Invalid State
```
  [❌ Invalid link]

  [Body: This link doesn't exist or has already been used.]

  [Link: Go to payfor.link/library to find your purchases]
```

---

## 12. Unlock Request `/unlock-request`

For buyers who lost their email or token expired.

```
[No navbar]

[Centered, max-width 480px]

  [H2: Get your access link]

  [Body: Enter the email you used to purchase and we'll resend your link.]

  [Input: Purchase email address]
  [ Send access links → ]

  [After submit:]
    ✉ Sent!
    Check [email] for your access links.
    You'll receive one email per purchase.
```

---

## 13. Buyer Library `/library`

Buyer's purchase history. No account required — magic link login by email.

### Unauthenticated State
```
[H2: Your purchases]

[Body: Enter your email to view your purchase history.]

[Input: Email address]
[ Send login link → ]
```

### Authenticated State
```
[H2: Your purchases]

[List of purchases:]
  [Row:]
    [Product title]
    [Date purchased]
    [Amount paid]
    [Re-access →]  ← triggers new unlock token + email

[If empty:]
  No purchases yet.
```

---

## 14. Stripe Connect Onboarding (Seller)

Triggered from `/product/[id]` or `/dashboard` when Stripe is not connected.

```
[Card, max-width 480px]

  [H2: Connect Stripe to get paid]

  [Body:
   We use Stripe to send you money securely. Setup takes about 2 minutes.
   Stripe will verify your identity and bank account.]

  [Feature list — 3 items:]
    ✓  Automatic payouts to your bank
    ✓  Identity verification handled by Stripe
    ✓  Tax documentation included

  [ Continue to Stripe → ]

  [Micro: You'll leave payfor.link temporarily. Come back here when done.]
```

### Post-Return State (redirect back from Stripe)
```
  ✅ Stripe connected

  [Body: You're all set. Your products are now live and accepting payments.]

  [ Go to dashboard → ]
```

---

## 15. Seller Settings `/settings`

Minimal — just what's needed.

```
[H2: Settings]

[Section: Account]
  Email: user@email.com  [readonly]

[Section: Stripe]
  Status: Connected ✅  |  View Stripe Dashboard ↗
  OR
  Status: Not connected  |  [ Connect Stripe ]

[Section: Danger zone]
  [ Delete account ]  ← opens confirmation modal
```

---

## 16. Error States

### 404
```
[Centered]

  [Large: 404]
  [Body: This page doesn't exist.]
  [Link: Go home →]
```

### Generic Error
```
  [Something went wrong.]
  [We've been notified. Try refreshing the page.]
  [ Refresh ]
```

---

## Mobile-First Rules

Every page must pass these checks before shipping:

1. **Price visible above the fold** on 375px viewport — no scroll required
2. **CTA button minimum 52px height** — comfortable thumb target
3. **No horizontal scroll** — everything wraps
4. **Inputs don't zoom** — `font-size: 16px` minimum on all inputs
5. **No hover-only interactions** — everything must be touch-accessible
6. **Content max-width 640px** — never full-bleed text on wide screens

---

## Tone of Voice

All copy follows these rules:

- **Short sentences.** If it can be 4 words, don't use 8.
- **No marketing speak.** "Effortless" and "powerful" are banned words.
- **Action-first labels.** "Pay $19 & Get Access" not "Proceed to Checkout".
- **State what happens.** "We'll send you an email" not "Verification required".
- **Never blame the user.** "This link has expired" not "You used an invalid link".

---

## Accessibility

- All color combinations meet **WCAG AA** (4.5:1 text contrast minimum)
- Focus ring visible on all interactive elements (`outline: 2px solid var(--text-primary)`)
- Form inputs have visible `<label>` elements (not just placeholder text)
- Error messages use both color AND text (never color alone)
- `prefers-reduced-motion` respected — all animations disabled when set

---

## Implementation Notes

- **shadcn/ui + Tailwind CSS** — maps cleanly to all token definitions above
- **DM Sans** via Google Fonts — single weight import (400, 500)
- **Stripe Checkout** — hosted redirect for MVP, embedded for v2
- **No toast library needed** — inline state changes handle feedback
- **Dark mode** — `class` strategy via `next-themes`, not `prefers-color-scheme` only (gives user control)
