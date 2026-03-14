# payfor.link — System Flows & Core Logic

## Overview

This document describes the high-level system flows and business logic for the Paywall Link platform.

The platform enables creators to monetize any digital resource (links, files, datasets) by creating a pay-to-unlock URL.

Core mechanic:

Create link → Pay → Verify → Unlock

Actors in the system:

- Seller (creator of a paid link)
- Buyer (person purchasing access)
- Platform (Next.js + backend logic)
- Stripe (payment + payout infrastructure)

---

# Core System Entities

## User (Seller)

Represents a creator using the platform to sell links.

Properties:

- id
- email
- name
- stripe_account_id
- created_at

---

## Link (Product)

Represents a monetized resource.

Properties:

- id
- seller_id
- title
- description
- destination_url
- price
- created_at
- status

Status options:

- active
- suspended
- deleted

---

## Purchase

Represents a completed payment for a link.

Properties:

- id
- link_id
- buyer_email
- stripe_payment_id
- amount
- created_at

---

# High-Level Flows

## 1. Seller Onboarding Flow

Goal: allow creators to start selling links.

Flow:

Seller visits platform
↓
Creates account (email magic login)
↓
Access dashboard
↓
Creates first link product
↓
Before publishing → connect Stripe
↓
Stripe Connect onboarding
↓
Seller receives shareable paywall link

Key logic:

- Seller must connect Stripe before selling
- Stripe account ID is stored in `users.stripe_account_id`

---

## 2. Create Link Product Flow

Goal: seller creates a monetized link.

Flow:

Seller opens dashboard
↓
Clicks “Create Product”
↓
Inputs:
	•	title
	•	description
	•	destination URL
	•	price
↓
System validates URL
↓
System performs safety checks
↓
Link stored in database
↓
Platform generates public paywall URL

Example generated URL:

domain.com/pay/notion-crm-template

Logic checks:

- URL format validation
- optional malware check
- optional domain blacklist

---

## 3. Buyer Purchase Flow

Goal: buyer purchases access to content.

Flow:

Buyer opens paywall link
↓
Product page loads
↓
Buyer clicks “Pay”
↓
Platform creates Stripe Checkout session
↓
Buyer redirected to Stripe
↓
Buyer completes payment

Stripe responsibilities:

- payment processing
- card validation
- fraud detection
- receipt generation

---

## 4. Payment Confirmation Flow

Goal: platform confirms payment and records purchase.

Flow:

Stripe payment completed
↓
Stripe sends webhook event
↓
Platform receives webhook
↓
Verify webhook signature
↓
Create purchase record in database
↓
Send unlock email to buyer

Webhook event used:

checkout.session.completed

Database logic:

create purchase:
link_id
buyer_email
stripe_payment_id
amount

---

## 5. Email Verification & Unlock Flow

Goal: ensure only the buyer accesses the content.

Flow:

Buyer receives unlock email
↓
Clicks magic unlock link
↓
Platform verifies purchase record
↓
Buyer confirms email
↓
Platform generates temporary unlock session
↓
Redirect buyer to destination URL

Security logic:

- email must match purchase record
- unlock session may expire after a time window

---

## 6. Seller Revenue Flow

Goal: distribute payments to sellers.

Flow:

Buyer pays via Stripe Checkout
↓
Stripe processes payment
↓
Platform collects application fee
↓
Remaining amount sent to seller Stripe account
↓
Stripe pays seller bank account

Platform never holds seller funds.

Stripe Connect handles:

- payouts
- identity verification
- tax compliance

---

## 7. Buyer Purchase Library Flow

Goal: allow buyers to re-access purchases.

Flow:

Buyer logs in with email
↓
System fetches purchases by email
↓
Display purchase list
↓
Buyer clicks product
↓
Unlock flow triggered

Example data query:

SELECT * FROM purchases WHERE buyer_email = user_email

---

# Abuse & Safety Flow

Goal: prevent malicious or illegal content.

Detection methods:

- domain reputation checks
- Google Safe Browsing API
- manual reports

User reporting flow:

User clicks “Report Product”
↓
Report stored in moderation queue
↓
Admin reviews report
↓
If violation confirmed:
suspend link
disable seller

Suspended links return:

Product unavailable

---

# Stripe Integration Logic

## Checkout Creation

Endpoint:

POST /api/create-checkout

Logic:

receive link_id
↓
fetch product
↓
create Stripe Checkout session
↓
include seller Stripe account
↓
redirect buyer to Stripe

---

## Webhook Handler

Endpoint:

POST /api/stripe-webhook

Logic:

verify Stripe signature
↓
detect event type
↓
if checkout.session.completed:
record purchase
trigger unlock email

---

# Security Principles

Platform responsibilities:

- verify Stripe webhooks
- validate URLs
- restrict malicious domains
- allow abuse reporting
- maintain purchase verification

Platform does NOT:

- host seller content
- guarantee seller product quality
- process payouts directly

Stripe handles:

- payments
- fraud detection
- seller identity
- chargebacks

---

# Scaling Considerations

The architecture supports early scaling:

Next.js (Vercel)
↓
Supabase (Postgres)
↓
Stripe

Expected capabilities:

- thousands of sellers
- tens of thousands of purchases
- minimal infrastructure complexity

Future scaling areas:

- caching paywall pages
- background job queues
- link analytics

---

# Core Design Principle

The product should remain extremely simple.

The entire system is built around a single interaction:

Lock link
↓
Pay
↓
Unlock

All additional features should support this core mechanic without increasing complexity.
