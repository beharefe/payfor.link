# payfor.link

## Product Summary

A simple platform that lets anyone get paid before sharing anything.

Paste any link, set a price, share the paywall URL. The other person pays via Stripe and gets access instantly by email.

**Core mechanic**

Paste link → set price → share → buyer pays → unlock link

---

# Core Value Proposition

**Get paid before you share anything.**

No invoices chased. No files sent before payment. No storefront needed.

One link. One price. Done.

---

# Target Users (MVP)

## 1. Freelancers & Contractors

People who deliver work as a file or link and need payment before handing it over.

Examples:
- Designer shares final Figma file after client pays
- Developer sends source code / GitHub repo after payment
- Video editor delivers exported file via Drive link
- Photographer sends full-res gallery link after deposit
- Agency delivers staging site URL once invoice is paid
- Consultant locks calendar booking link behind a paid session fee

Pain they have today: share work → wait for payment → follow up → regret sharing early

---

## 2. Digital Product Creators

People building once and selling repeatedly.

Examples:
- Notion template creators
- Figma UI kits and design systems
- Google Sheets dashboards and financial models
- Airtable and Coda templates
- Canva template packs
- Prompt packs and AI workflows
- Resource libraries and swipe files
- Developer starter kits and boilerplates

Pain they have today: Gumroad/Lemon Squeezy require a full storefront setup just to sell one thing

---

## 3. Artists & Independent Creators

People sharing creative work who want to charge for specific pieces.

Examples:
- Musician shares private SoundCloud / Google Drive track link
- Illustrator delivers commission files after payment
- Photographer sells individual shoots
- Writer locks premium essays or research behind a paywall
- Video creator shares unlisted YouTube link after payment
- Animator delivers project files to client

Pain they have today: no simple way to charge for a single piece without a full platform

---

## 4. Community & Access Sellers

People selling access to a private space or session.

Examples:
- Private Discord or Telegram invite link
- Paid Zoom / Google Meet session link
- Notion workspace or database invite
- Paid newsletter archive access
- Private community or group access

Pain they have today: manually DM-ing payment details and links, no automation

---

## 5. Indie Hackers & Developers

People with small tools or datasets to monetize.

Examples:
- Selling a dataset as a CSV / Drive link
- Charging for a private GitHub repo
- Monetizing an Airtable base or API key
- Selling access to a private tool or dashboard

---

# Use Cases Summary

| Type | What they lock | What buyer gets |
|---|---|---|
| Freelancer | Figma / Drive / GitHub | Delivered work |
| Template creator | Notion / Sheets / Figma | Duplicate template |
| Artist | Drive / SoundCloud / Dropbox | Creative file |
| Access seller | Discord / Telegram / Notion invite | Community access |
| Developer | GitHub repo / dataset / API | Code or data |
| Consultant | Calendly / cal.com link | Paid session booking |

---

# Core Mechanic (unchanged)

Same flow for every use case:

Paste link → Set price → Share → Buyer pays → Unlock

The platform doesn't care what the link is. It just gates it behind a payment.

---

# MVP Features

## Seller Features

- Create account (magic link, no password)
- Create a paywall link
- Paste any destination URL
- Set a title, description, and price
- Connect Stripe to receive payouts
- Share the paywall link anywhere
- View sales dashboard

---

## Buyer Features

- View product / service page
- Pay via Stripe Checkout
- Receive unlock email instantly
- Access the link
- Re-access purchases via library

---

## Platform Features

- Stripe Checkout
- Stripe Connect Express payouts
- Email-based unlock (single-use token, 24h expiry)
- Token resend flow
- Basic abuse reporting
- URL safety check (Google Safe Browsing)
- Simple analytics events

---

# User Flows

## Seller Flow

Sign up
↓
Create paywall link
↓
Paste destination URL
↓
Set title + price
↓
Connect Stripe (before going live)
↓
Share paywall link

Example:

payfor.link/pay/brand-identity-final-files

---

## Buyer Flow

Open paywall link
↓
View product/service page
↓
Pay via Stripe
↓
Receive unlock email
↓
Click link → access content

---

# Pages Required

## Marketing

/
/pricing
/how-it-works

---

## Seller

/dashboard
/create
/product/[id]
/settings

---

## Buyer

/pay/[slug]
/pay/[slug]/success
/unlock
/unlock-request
/library

---

# Technical Stack

## Frontend / Backend

- Next.js (App Router)
- Vercel hosting

---

## Database / Auth

- Supabase (Postgres)
- Supabase Auth (magic email login)

---

## Payments

- Stripe Checkout (hosted redirect)
- Stripe Connect Express

---

## Email

- Resend (transactional emails)
- Custom SMTP with SPF/DKIM/DMARC configured

---

## Analytics

- PostHog (preferred) or Amplitude free plan

---

# Database Schema (MVP)

## users

id uuid
email text
name text
stripe_account_id text
created_at timestamp

---

## links

id uuid
seller_id uuid
slug text unique
title text
description text
destination_url text
price numeric
status text  -- draft | active | suspended | deleted
created_at timestamp

---

## purchases

id uuid
link_id uuid
buyer_email text
stripe_payment_id text unique
amount numeric
delivery_url text  -- snapshot at purchase time
status text        -- paid | refunded | disputed
created_at timestamp

---

## unlock_tokens

id uuid
purchase_id uuid
token_hash text
expires_at timestamp
used_at timestamp
created_at timestamp

---

# API Endpoints

POST /api/create-product
POST /api/create-checkout
POST /api/stripe-webhook
POST /api/connect-stripe
GET  /api/purchases
POST /api/unlock-request

---

# Stripe Setup

## Stripe Checkout

Handles buyer payments — payment UI, card validation, Apple Pay, Google Pay, receipts.

---

## Stripe Connect Express

Handles seller payouts — identity verification, bank onboarding, automatic payouts, tax compliance.

Platform fee: 4.5% collected as Stripe Connect application fee per transaction.

---

# Security / Safety

Basic protections:

- Google Safe Browsing API on destination URL
- Domain blacklist check
- Report abuse button on every paywall page

Abuse handling:

report → review → suspend link → ban seller

---

# SEO Strategy

Landing pages targeting both creator and freelancer queries:

/sell-notion-template
/sell-figma-template
/monetize-google-drive
/sell-ai-prompts
/paywall-a-link
/get-paid-before-sharing
/freelance-file-delivery
/sell-digital-downloads
/charge-for-discord-access
/sell-design-files

Goal: capture search traffic from both digital product creators and freelancers looking for simple payment solutions.

---

# Analytics Events

signup
product_created
checkout_started
payment_success
unlock_success
unlock_resent
token_expired

---

# Development Phases

## Phase 1 — Core MVP

- Auth (magic link)
- Create paywall link
- Paywall page
- Stripe Checkout
- Webhook payment handling
- Unlock email + token
- Unlock page
- Token resend flow

---

## Phase 2 — Seller Dashboard

- Product list
- Sales table with revenue breakdown
- Stripe Connect onboarding
- Product edit / delete

---

## Phase 3 — Polish

- Buyer purchase library
- Refund flow (seller-initiated)
- Abuse reporting UI
- SEO landing pages
- Preview image support

---

# Success Metrics

Early traction targets:

20 active sellers
100 purchases

Key metrics:

- Active sellers (at least 1 sale)
- Products created
- Total purchases
- GMV (gross merchandise volume)
- Platform fee revenue (GMV × 4.5%)
- Unlock success rate (payments that result in successful unlocks)

---

# Core Product Principle

**Get paid before you share anything.**

The entire system exists to solve one problem: people share links before getting paid and regret it.

Lock link
↓
Pay
↓
Unlock

Works for templates. Works for freelance deliverables. Works for creative files. Works for community access.

The link type doesn't matter. The mechanic is universal.
