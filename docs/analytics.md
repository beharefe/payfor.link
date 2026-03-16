# Analytics Strategy

## Provider

**Amplitude** — free tier: 10M events/month, 10K MTUs, Session Replay, Feature Flags.

---

## Setup

```bash
npm install @amplitude/analytics-browser
```

```env
NEXT_PUBLIC_AMPLITUDE_API_KEY=
```

```typescript
// lib/analytics.ts
import * as amplitude from '@amplitude/analytics-browser'

export const initAnalytics = () => {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) return

  amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY, {
    defaultTracking: {
      pageViews: true,
      sessions: true,
      formInteractions: false,   // we track forms manually
      fileDownloads: false
    },
    autocapture: false           // manual tracking only
  })
}

export const track = (
  event: string,
  properties?: Record<string, unknown>
) => {
  if (typeof window === 'undefined') return
  amplitude.track(event, properties)
}

export const identify = (userId: string, traits?: Record<string, unknown>) => {
  amplitude.setUserId(userId)
  if (traits) {
    const identifyEvent = new amplitude.Identify()
    Object.entries(traits).forEach(([key, value]) => {
      identifyEvent.set(key, value as amplitude.Types.ValidPropertyType)
    })
    amplitude.identify(identifyEvent)
  }
}

export const reset = () => {
  amplitude.reset()
}
```

```typescript
// app/layout.tsx
'use client'
import { useEffect } from 'react'
import { initAnalytics } from '@/lib/analytics'

export default function RootLayout({ children }) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return <html>{children}</html>
}
```

---

## Events

### Core 5 (MVP — track these first, nothing else)

These map directly to the PRD success metrics.

---

#### `signup`
Fired when seller completes magic link auth for the first time.

```typescript
track('signup', {
  method: 'magic_link'
})
```

When: after Supabase `onAuthStateChange` fires with a new user session and `created_at` matches today.

---

#### `product_created`
Fired when seller successfully creates a paywall link.

```typescript
track('product_created', {
  price: 19,
  platform: 'notion',     // detected from destination URL domain
  has_description: true
})
```

When: after `/api/create-product` returns 200.

---

#### `checkout_started`
Fired when buyer clicks "Pay & Get Access" and is redirected to Stripe.

```typescript
track('checkout_started', {
  link_id: 'abc123',
  price: 19,
  slug: 'notion-crm-template',
  platform: 'notion'
})
```

When: before redirect to Stripe Checkout URL.

---

#### `payment_success`
Fired server-side via Stripe webhook after `checkout.session.completed`.

```typescript
// Server-side — use Amplitude's HTTP API directly
// lib/analytics-server.ts

export const trackServer = async (
  event: string,
  properties: Record<string, unknown>
) => {
  if (!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) return

  await fetch('https://api2.amplitude.com/2/httpapi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
      events: [{
        event_type: event,
        event_properties: properties,
        time: Date.now(),
        insert_id: properties.purchase_id as string  // dedup
      }]
    })
  })
}

// In webhook handler:
await trackServer('payment_success', {
  purchase_id: purchase.id,
  link_id: purchase.link_id,
  amount: purchase.amount,
  platform: 'notion'
})
```

When: inside `POST /api/stripe-webhook` after purchase record is created.

---

#### `unlock_success`
Fired when buyer successfully validates token and gets redirected to content.

```typescript
// Server-side
await trackServer('unlock_success', {
  purchase_id: purchase.id,
  link_id: purchase.link_id,
  time_to_unlock_minutes: minutesSincePurchase
})
```

When: inside unlock handler after token is validated and before redirect.

---

## Seller Identification

Identify sellers so you can segment analytics by seller activity.

```typescript
// After magic link login
identify(user.id, {
  email: user.email,
  created_at: user.created_at,
  stripe_connected: !!user.stripe_account_id
})
```

Buyers are anonymous — never identify buyers, they have no accounts.

---

## Session Replay

Enabled on free tier. Configure to capture paywall pages only.

```typescript
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser'

amplitude.add(sessionReplayPlugin({
  sampleRate: 1,          // 100% on MVP — reduce when traffic grows
  privacyConfig: {
    blockSelector: [
      '[data-private]',   // add this attr to price inputs, emails
    ]
  }
}))
```

Add `data-private` to any input containing buyer email or payment data.

Most valuable replays to watch: sessions that hit the paywall page but never completed `checkout_started`.

---

## Funnel to Monitor

```
paywall_viewed  (page view — auto-tracked)
        ↓
checkout_started
        ↓
payment_success   (webhook — server)
        ↓
unlock_success    (server)
```

Drop-off between `paywall_viewed` → `checkout_started` = paywall conversion rate.
Drop-off between `checkout_started` → `payment_success` = Stripe completion rate (Stripe handles this, should be >90%).
Drop-off between `payment_success` → `unlock_success` = email deliverability issue.

---

## Rules

1. **5 events only in MVP** — no event creep until you have real users
2. **Never track PII** — no emails, no names in event properties
3. **Server-side for payment events** — never trust client for revenue data
4. **Use `insert_id`** for server events to prevent duplicates (use `purchase_id`)
5. **No tracking in development** — check `NODE_ENV` before firing
