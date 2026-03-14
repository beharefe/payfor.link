# payfor.link

## Product Summary

A simple platform that allows creators to monetize any link.

Users paste a destination link (Notion, Figma, Google Drive, etc.), set a price, and receive a pay-to-unlock URL. Buyers pay via Stripe and gain access after email verification.

**Core mechanic**

Paste link → set price → share → buyer pays → unlock link

---

# Target Users (MVP)

Primary users:

- Notion template creators
- Indie hackers
- Freelancers selling digital resources
- Developers selling starter kits
- Twitter/X creators selling small digital products

Example products:

- Notion templates
- Figma design kits
- Google Sheets dashboards
- Prompt packs
- Resource libraries

---

# Core Value Proposition

Sell any digital resource with a single link.

No storefronts.  
No product pages.  
No platform lock-in.

Paste link → Set price → Get paid

---

# MVP Features

## Seller Features

- Create account
- Create link product
- Paste destination link
- Set price
- Connect Stripe
- Share paywall link
- View sales dashboard

---

## Buyer Features

- View product page
- Pay via Stripe Checkout
- Email verification
- Unlock content
- Purchase library (simple history)

---

## Platform Features

- Stripe Checkout
- Stripe Connect payouts
- Email unlock verification
- Basic abuse reporting
- Simple analytics events

---

# User Flow

## Seller Flow

Sign up
↓
Create product
↓
Paste destination link
↓
Set price
↓
Before publishing → connect Stripe
↓
Share paywall link

Example shared link:

domain.com/notion-crm-template

---

## Buyer Flow

Open paywall link
↓
View product page
↓
Stripe checkout
↓
Payment success
↓
Email verification
↓
Unlock destination link

---

# Pages Required

## Marketing

/
pricing
how-it-works

---

## Seller

/dashboard
/create
/product/[id]

---

## Buyer

/pay/[linkId]
/unlock/[linkId]
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

- Stripe Checkout
- Stripe Connect Express

---

## Email

- Resend (transactional emails)

---

## Analytics

- Amplitude (free plan) or PostHog

---

# Database Schema (MVP)

## users

id
email
name
stripe_account_id
created_at

---

## links

id
seller_id
title
destination_url
price
description
created_at

---

## purchases

id
link_id
buyer_email
stripe_payment_id
amount
created_at

---

# API Endpoints

POST /api/create-product
POST /api/create-checkout
POST /api/stripe-webhook
POST /api/connect-stripe
GET  /api/purchases

---

# Stripe Setup

## Stripe Checkout

Handles buyer payments.

Features:

- payment UI
- card validation
- receipts

---

## Stripe Connect Express

Handles seller payouts.

Features:

- seller identity verification
- bank account onboarding
- automatic payouts
- tax compliance

---

# Security / Safety

Basic protections:

- Google Safe Browsing link scan
- domain blacklist
- report abuse button

Abuse handling:

report → review → disable link → ban seller

---

# SEO Strategy

Landing pages targeting creator queries:

/paywall-link
/sell-notion-template
/monetize-google-drive
/sell-figma-template

Goal: capture creator search traffic.

---

# Analytics Events

Track minimal events:

signup
product_created
checkout_started
payment_success
unlock_success

---

# Development Phases

## Phase 1 — Core MVP

Build:

- auth
- create link
- paywall page
- Stripe checkout
- webhook payment handling
- unlock page

---

## Phase 2 — Seller Dashboard

Add:

- product list
- sales table
- Stripe connect onboarding

---

## Phase 3 — Product Polish

Add:

- buyer purchase library
- preview images
- abuse reporting
- SEO landing pages

---

# Success Metrics

Early traction indicators:

20 sellers
100 purchases

Key metrics:

- active sellers
- products created
- total purchases
- GMV (gross merchandise volume)

---

# Core Product Principle

Keep the product extremely simple.

Lock link
↓
Pay
↓
Unlock

Complex storefront features are intentionally excluded from the MVP.
