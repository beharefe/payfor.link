#  System Architecture Diagram

## Mermaid

```mermaid
flowchart TD
    A[Seller] --> B[Next.js App on Vercel]
    C[Buyer] --> B

    B --> D[Supabase Auth]
    B --> E[Supabase Postgres]
    B --> F[Stripe Checkout]
    B --> G[Stripe Connect]
    B --> H[Resend Email]
    B --> I[Safe Browsing / URL Checks]

    F --> J[Stripe Webhook]
    J --> B

    B --> K[Unlock Logic]
    K --> E
    K --> H
    K --> L[Destination URL<br/>Notion / Figma / Drive / etc.]

    G --> M[Seller Bank Account]

    E --> N[Users]
    E --> O[Links]
    E --> P[Purchases]


⸻

ASCII

                    +---------------------+
                    |       Seller        |
                    +----------+----------+
                               |
                               v
+---------------------+   +------------------------+   +----------------------+
|        Buyer        +-->+  Next.js App (Vercel)  +-->|  Supabase Auth       |
+----------+----------+   +-----------+------------+   +----------------------+
           |                          |
           |                          +-----------------> Supabase Postgres
           |                          |                   - users
           |                          |                   - links
           |                          |                   - purchases
           |                          |
           |                          +-----------------> Stripe Checkout
           |                          |
           |                          +<---------------- Stripe Webhook
           |                          |
           |                          +-----------------> Stripe Connect
           |                          |                   (seller onboarding,
           |                          |                    payouts)
           |                          |
           |                          +-----------------> Resend Email
           |                          |
           |                          +-----------------> Safe Browsing / URL Scan
           |                          |
           |                          +-----------------> Unlock Logic
           |                                              |
           |                                              v
           |                                   +----------------------+
           +---------------------------------->|  Destination URL     |
                                               | Notion / Figma /     |
                                               | Drive / GitHub / etc |
                                               +----------------------+

Stripe Connect
      |
      v
+----------------------+
| Seller Bank Account  |
+----------------------+


⸻

Main Runtime Flow

sequenceDiagram
    participant S as Seller
    participant App as Next.js App
    participant DB as Supabase
    participant Stripe as Stripe
    participant Email as Resend
    participant B as Buyer
    participant Dest as Destination URL

    S->>App: Create product
    App->>DB: Save link/product
    S->>App: Connect Stripe
    App->>Stripe: Stripe Connect onboarding

    B->>App: Open paywall page
    B->>App: Click pay
    App->>Stripe: Create Checkout Session
    B->>Stripe: Complete payment
    Stripe->>App: Webhook: checkout.session.completed
    App->>DB: Create purchase
    App->>Email: Send unlock email

    B->>App: Open unlock link / verify email
    App->>DB: Check purchase
    App->>Dest: Redirect buyer
