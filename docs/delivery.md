
Link Delivery Proposal

# Link Delivery Architecture Proposal

## Purpose

This document defines how digital products are delivered to buyers after payment.

The delivery system must ensure:

- simple user experience
- controlled access to paid resources
- minimal infrastructure complexity
- reasonable protection against link sharing

The platform does not host seller content.  
It only controls **access to external resources**.

---

# Core Delivery Model

The platform uses a **token-based unlock system**.

High-level flow:

Buyer opens paywall
↓
Stripe payment
↓
Webhook confirms purchase
↓
Unlock token generated
↓
Buyer receives unlock email
↓
Buyer clicks unlock link
↓
Token verified
↓
Redirect to destination resource

The platform acts as an **access gateway**, not a file host.

---

# Delivery Types

The platform supports two types of product delivery.

## Type 1 — External Link Delivery

The most common use case.

Example resources:

- Notion templates
- Google Drive folders
- Figma files
- GitHub repositories
- Airtable templates
- Canva templates

Delivery mechanism:

unlock → redirect → destination URL

The platform never stores the content.

---

## Type 2 — File Upload Delivery (Future)

Optional future feature.

Files stored in:

object storage

Examples:

- PDFs
- ZIP files
- datasets
- audio files

Delivery uses:

signed download URLs

These URLs provide **temporary access to files without exposing them publicly**.  [oai_citation:1‡Google Cloud Documentation](https://docs.cloud.google.com/storage/docs/access-control/signed-urls?utm_source=chatgpt.com)

---

# Unlock Token System

Every purchase generates an **unlock token**.

Example unlock link:

/unlock?token=abc123

Token properties:

random 32 byte token
stored hashed in database
single-use
24 hour expiration

Tokens prove that the buyer completed a purchase.

---

# Token Validation Flow

buyer clicks unlock link
↓
token received by server
↓
hash token
↓
lookup token in database
↓
verify:
token exists
token not expired
token not used
↓
mark token used
↓
redirect buyer to destination

If validation fails:

display access error

---

# Destination Redirect

Once the token is validated:

302 redirect → destination_url

Example:

/unlock?token=abc123
→ redirect → https://notion.so/template-link

The redirect ensures the destination URL is only revealed after verification.

---

# Anti-Abuse Measures

The platform uses several lightweight protections.

## 1. Single-Use Tokens

Each unlock token works only once.

This prevents unlimited sharing of the unlock link.

---

## 2. Token Expiration

Tokens expire after:

24 hours

Expired tokens require requesting a new unlock link.

---

## 3. Email Verification

The buyer email must match the purchase record.

Unlock flow:

verify purchase email
↓
allow access

---

## 4. Unlock Rate Limits

Example limits:

max unlock attempts per purchase = 5

If exceeded:

unlock disabled
manual review required

---

# Purchase-Based Access Model

Access is tied to purchases.

Data structure:

Link
↓
Purchase
↓
Buyer Email

Example:

Link: Notion CRM Template
├── Purchase #1 (alice@email.com)
├── Purchase #2 (bob@email.com)
├── Purchase #3 (charlie@email.com)

Each purchase grants access independently.

---

# Buyer Re-Access System

Buyers can regain access through a **purchase library**.

Flow:

buyer opens /library
↓
enter purchase email
↓
magic login link sent
↓
view purchased products
↓
click unlock again

Database query:

SELECT * FROM purchases WHERE buyer_email = ?

This avoids forcing buyers to create accounts.

---

# Link Lifecycle Interaction With Delivery

Delivery depends on link state.

draft
active
suspended
deleted

Behavior:

| Status | Behavior |
|------|------|
| draft | private |
| active | purchasable |
| suspended | blocked |
| deleted | hidden from new buyers |

Important rule:

existing purchases remain valid

Even if a seller deletes a product.

---

# Optional Future Enhancements

The delivery system can support additional features later.

## Expiring Products

Add field:

links.expires_at

Example use cases:

- temporary reports
- event access
- limited releases

Purchased buyers may retain access depending on seller policy.

---

## Signed Resource URLs

For hosted files:

signed download URLs

These provide **temporary authenticated access** to private files.  [oai_citation:2‡Transloadit](https://transloadit.com/devtips/using-signed-urls-to-secure-your-cdn-content/?utm_source=chatgpt.com)

---

## Watermarking

To discourage piracy:

embed buyer email
embed purchase ID
embed timestamp

Example:

Purchased by: alice@email.com
Order ID: 87321

---

# Security Philosophy

The system focuses on **deterrence rather than perfect DRM**.

Goals:

prevent casual sharing
track abuse
make piracy inconvenient

Complete prevention of copying is impossible once a buyer legitimately receives content.

The system therefore prioritizes:

secure access control
buyer traceability
simple user experience

---

# Core Delivery Principle

The platform remains intentionally simple.

Lock link
↓
Pay
↓
Unlock
↓
Access content

Everything in the delivery architecture supports this single interaction.
