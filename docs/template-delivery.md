


# Template Delivery Architecture

## Purpose

This document defines how template-based digital products are delivered to buyers after purchase.

Template products differ from normal file downloads because they are **duplicated or copied into the buyer’s environment** rather than downloaded as files.

Supported platforms:

- Notion
- Figma
- Google Drive
- GitHub
- Canva
- Airtable

The system must ensure:

- controlled access through the paywall
- correct duplication instructions
- protection against casual link sharing
- simple delivery for creators

---

# Core Principle

Templates are **never hosted by the platform**.

Instead, the platform delivers **controlled access to duplication links**.

Delivery flow:

paywall
↓
payment confirmed
↓
unlock token
↓
delivery page
↓
template duplication

The delivery page acts as the **gateway between payment and duplication**.

---

# Delivery Page

After unlock, buyers are directed to:

/delivery/{purchase_id}

This page contains:

- duplication instructions
- template link
- license information
- buyer watermark

Example page:

🎉 Purchase successful!

Step 1: Click the button below
Step 2: Duplicate the template to your workspace

[ Duplicate Template ]

---

# Notion Template Delivery

## How duplication works

Notion templates are copied into the buyer's workspace by clicking **Duplicate** on a public template page.  [oai_citation:0‡Notion](https://www.notion.com/help/duplicate-public-pages?utm_source=chatgpt.com)

Typical duplication process:

open template page
↓
click “Duplicate”
↓
select workspace
↓
template copied

The duplicated template appears in the user's sidebar and can be edited independently.  [oai_citation:1‡landmarklabs.co](https://www.landmarklabs.co/insights/how-to-use-notion-templates?utm_source=chatgpt.com)

---

## Required link format

Sellers must provide the **duplication-enabled URL**.

Example:

https://notion.so/workspace/template-page?duplicate=true

This modifier allows the template to be copied automatically.

---

## Validation rules

When seller submits template link:

check domain = notion.so
check duplication enabled
check page public

If duplication disabled, product cannot be published.

---

# Figma Template Delivery

Figma files can be duplicated by users who have **view access** to a file.  [oai_citation:2‡help.figma.com](https://help.figma.com/hc/en-us/articles/360038511533-Duplicate-or-copy-files?utm_source=chatgpt.com)

Duplication methods:

File menu → Duplicate

or

append /duplicate to file URL

Example:

https://figma.com/file/abc123/design-file/duplicate

The duplicate file is placed in the user's drafts.

---

# Google Drive Template Delivery

Google Drive supports template copying using **Make a Copy**.

Typical workflow:

open document
↓
File → Make a copy
↓
saved to user’s drive

Supported types:

- Google Docs
- Google Sheets
- Google Slides

Seller must share file with:

view access

This allows duplication without editing the original.

---

# GitHub Repository Delivery

GitHub projects can be delivered as **template repositories**.

Two duplication methods:

### Template repository

Use this template

Creates a new repository based on the template.

---

### ZIP download

Alternative delivery:

Download ZIP

Used for starter kits and boilerplates.

---

# Delivery URL Snapshot

At purchase time, the system stores a **snapshot of the delivery URL**.

Database field:

purchases.delivery_url

This ensures delivery still works even if the seller later:

- edits the product
- deletes the listing
- changes the link

Example purchase record:

purchase_id
link_id
buyer_email
delivery_url

Unlock redirects always use the snapshot URL.

---

# License Watermark

Delivery page includes buyer watermark:

Purchased by: buyer@email.com
Order ID: 87321

Purpose:

- discourage redistribution
- help identify leaks
- give creators proof of purchase

---

# Unlock Security

Unlock access uses **single-use tokens**.

Example unlock URL:

/unlock?token=abc123

Token properties:

single use
24 hour expiry
stored hashed
linked to purchase_id

After validation:

redirect to delivery page

---

# Buyer Re-Access

Buyers can regain access via the purchase library.

Flow:

buyer visits /library
↓
enter purchase email
↓
magic login link sent
↓
view purchases
↓
open delivery page again

This allows access even if the original email is lost.

---

# Seller Responsibilities

Sellers must ensure:

- template duplication is enabled
- resource is publicly viewable
- destination link remains valid
- license terms are respected

The platform does not verify template functionality.

---

# Anti-Abuse Strategy

The platform uses light protections:

single-use unlock tokens
delivery page gateway
buyer watermark
unlock rate limits

These measures reduce casual piracy.

However, complete copy prevention is impossible once a user legitimately accesses content.

---

# Future Enhancements

Possible improvements:

### Template verification

Automatically check if duplication is enabled.

---

### Platform-specific delivery helpers

Example:

auto-generate Notion duplication link
auto-detect Figma duplicate URL

---

### Creator onboarding guides

Provide instructions for:

- enabling Notion duplication
- setting Figma view permissions
- sharing Drive templates correctly

---

# Core Delivery Principle

The platform controls **access to templates**, not the templates themselves.

Core workflow:

Create link
↓
Pay
↓
Unlock
↓
Duplicate template

This keeps the system simple, scalable, and compatible with many external tools.


⸻

Important insight for your product

This architecture is actually very powerful strategically because:

Your platform becomes a universal paywall for tools that never built monetization:
	•	Notion
	•	Figma
	•	Airtable
	•	Drive
	•	GitHub

They all support duplication but none provide built-in payment systems.

That gap is exactly where your product lives.
