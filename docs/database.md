## Overview

The platform stores minimal internal data and relies on external services for payments, authentication, and messaging.

Core principle:

Platform stores metadata
External services handle infrastructure-heavy operations

External providers:

- Stripe → payments and payouts
- Supabase → database and authentication
- Resend → email delivery
- Safe Browsing / VirusTotal → link safety checks
- Vercel → hosting and server execution

---

# Database Schema Relationships

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ LINKS : creates
    LINKS ||--o{ PURCHASES : purchased
    USERS ||--o{ PURCHASES : buys

    USERS {
        uuid id
        string email
        string name
        string stripe_account_id
        timestamp created_at
    }

    LINKS {
        uuid id
        uuid seller_id
        string title
        string description
        string destination_url
        numeric price
        string status
        timestamp created_at
    }

    PURCHASES {
        uuid id
        uuid link_id
        string buyer_email
        string stripe_payment_id
        numeric amount
        timestamp created_at
    }


⸻

Database Logic

Users Table

Represents platform accounts.

Used for:
	•	seller dashboards
	•	Stripe Connect onboarding
	•	product ownership

Important field:

stripe_account_id

This links the seller to Stripe payouts.

⸻

Links Table

Represents products created by sellers.

Each row corresponds to:

1 monetized link

Example:

title: Notion CRM Template
destination_url: https://notion.so/template-link
price: $19

Public paywall URL is generated using:

domain.com/pay/{link_id}


⸻

Purchases Table

Represents successful payments.

Created when Stripe sends:

checkout.session.completed

Stores:
	•	which product was purchased
	•	buyer email
	•	Stripe payment reference

Used for:
	•	unlock verification
	•	buyer library
	•	seller sales analytics

⸻

External Services Data Flow

Stripe

Stripe handles:
	•	payment processing
	•	receipts
	•	fraud detection
	•	chargebacks
	•	seller payouts

Data Relationship

users.stripe_account_id → Stripe Connect account
purchases.stripe_payment_id → Stripe payment record


⸻

Supabase

Supabase handles:
	•	authentication
	•	database storage
	•	row-level security

Data relationship

auth.users.id → users.id

Authentication uses:

magic email login


⸻

Email Service (Resend)

Used for:
	•	unlock emails
	•	login magic links
	•	purchase confirmations

Example email triggers:

payment_success
unlock_link
login_link


⸻

Safe Browsing / Link Safety

When a seller creates a product:

destination_url → scanned via Safe Browsing API

If flagged:

product.status = suspended

This prevents known malware domains.

⸻

Marketing & SEO Page Generation

The platform automatically generates SEO pages based on:
	•	product types
	•	common creator queries
	•	user-generated content

Goal: capture search traffic from creators.

⸻

Static Marketing Pages

Examples:

/paywall-link
/sell-notion-template
/monetize-google-drive
/sell-figma-template
/sell-ai-prompts

These pages explain how to monetize specific content types.

⸻

Dynamic Product Pages

Every product generates an SEO-accessible page.

Example:

/pay/notion-crm-template
/pay/startup-financial-model

Page contains:
	•	product title
	•	description
	•	preview
	•	seller name
	•	price

This allows indexing by search engines.

⸻

SEO Metadata Generation

Each page automatically includes:

title
description
OpenGraph tags
schema.org Product markup

Example:

<title>Buy Notion CRM Template - $19</title>
<meta description="Unlock this Notion CRM template instantly. Pay once and duplicate to your workspace.">


⸻

AI / Agent Discoverability

SEO pages should allow crawling by AI bots:

GPTBot
ClaudeBot
PerplexityBot
OAI-SearchBot

robots.txt example:

User-agent: *
Allow: /

These pages help AI tools recommend the platform when users search for:

how to sell notion templates
sell digital downloads
paywall a link


⸻

Data Ownership Model

Platform stores only essential metadata.

Data	Stored Where
seller identity	Stripe + Supabase
payment records	Stripe
product metadata	Supabase
purchase records	Supabase
digital content	external link or storage

This keeps the system lightweight and scalable.

⸻

Key Principle

The system should remain minimal:

metadata in DB
payments via Stripe
content hosted elsewhere

This avoids complex infrastructure while supporting thousands of sellers and purchases.
