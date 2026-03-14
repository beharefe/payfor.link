We think this and it can be simply shared with sellers just providing them "Test Link" button


# Creator Product Validation

## Purpose

This document defines automated validation rules for creator products before they are published.

The goal is to prevent:

- broken template links
- incorrect permissions
- non-duplicable templates
- inaccessible resources

Without validation, buyers may purchase products they cannot access.

---

# Validation Flow

When a seller creates a product:

seller submits product
↓
platform validates delivery link
↓
if validation passes → product can be published
↓
if validation fails → seller receives error message

Validation occurs before the link can move from:

draft → active

---

# Validation Architecture

Validation is performed using:

URL parsing
domain detection
platform-specific rules
optional HTTP checks

Validation result:

valid
warning
error

Errors block publishing.

---

# Supported Platform Detection

The system identifies the platform using the domain.

Example mapping:

| Domain | Platform |
|------|------|
| notion.so | Notion |
| notion.site | Notion |
| figma.com | Figma |
| docs.google.com | Google Docs |
| sheets.google.com | Google Sheets |
| drive.google.com | Google Drive |
| github.com | GitHub |
| canva.com | Canva |

If the platform is unknown:

validation = warning

The seller may still publish.

---

# Notion Template Validation

Notion templates must allow duplication.

Notion templates work by duplicating a public page into the user’s workspace.  [oai_citation:0‡Notion](https://www.notion.com/help/duplicate-public-pages?utm_source=chatgpt.com)

Validation checks:

domain contains notion.so or notion.site
duplicate modifier present (?duplicate=true)
page publicly accessible

Example valid link:

https://workspace.notion.site/template-id?duplicate=true

---

## Common Errors

### Duplicate Disabled

If duplication is disabled, the template cannot be copied.

Error:

This Notion page cannot be duplicated.
Enable “Allow duplicate as template” in Notion.

The duplication option must be enabled when sharing the page publicly.  [oai_citation:1‡app.studyraid.com](https://app.studyraid.com/en/read/44161/2051811/activating-the-allow-duplicate-as-template-option?utm_source=chatgpt.com)

---

### Incorrect Link Domain

If the creator uses:

notion.so internal link

the duplicate button may not appear.

Error:

Use the public Notion site link instead of the internal workspace link.

---

# Figma Template Validation

Figma templates must allow duplication.

Validation checks:

domain = figma.com
file accessible
view permissions enabled

Optional validation:

/duplicate suffix detected

Example valid link:

https://figma.com/file/ABC123/design/duplicate

---

# Google Drive Template Validation

Supported file types:

Google Docs
Google Sheets
Google Slides

Validation checks:

domain = docs.google.com or drive.google.com
file accessible
sharing permission = viewer

Example valid link:

https://docs.google.com/document/d/FILE_ID

Buyers must be able to create their own copy.

---

# GitHub Template Validation

GitHub templates must be:

public repository
template repository OR downloadable

Validation checks:

domain = github.com
repository exists
repository public

Example valid link:

https://github.com/user/template-repo

---

# Generic Link Validation

For unknown platforms:

Basic checks:

valid URL format
domain resolves
HTTP status not error

If checks pass:

validation = warning

Seller may still publish.

---

# Pre-Publish Validation UI

When creator clicks:

Publish product

System runs validation.

Possible outcomes:

## Pass

Product published successfully.

---

## Warning

Your link could not be fully validated.
Make sure buyers can access and duplicate your template.

---

## Error

Your template cannot be duplicated.

Fix the following:
	•	enable template duplication
	•	make page public

Publishing is blocked.

---

# Seller Self-Test Feature (Future)

Add a tool:

Test template delivery

Flow:

open duplication link
simulate buyer
verify duplicate works

This helps creators confirm functionality.

---

# Validation Logging

Store validation results:

validation_status
validation_errors
validation_timestamp

This allows debugging if buyers report issues.

---

# Common Template Failures

Most template issues come from:

duplication disabled
private page
wrong sharing link
incorrect platform permissions

These issues must be caught before publication.

---

# Core Validation Principle

Creators must provide **working duplication links**.

The platform enforces:

correct access
correct permissions
correct duplication behavior

This prevents buyers from purchasing broken products.


⸻

Why this document is extremely important

Most platforms do not validate template links, which causes:
	•	refunds
	•	support tickets
	•	broken products

Your validation layer will make the marketplace much higher quality.
