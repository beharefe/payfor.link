# Error Tracking

## Provider

**Sentry** — free tier: 5K errors/month, 50 replays, full Next.js App Router support.

---

## Setup

```bash
npx @sentry/wizard@latest -i nextjs
```

This auto-generates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.js` instrumentation

```env
SENTRY_DSN=
SENTRY_AUTH_TOKEN=       # for source map uploads (get from Sentry → Settings → Auth Tokens)
SENTRY_ORG=
SENTRY_PROJECT=
```

---

## Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',

  // Performance
  tracesSampleRate: 0.1,        // 10% of transactions — enough for MVP

  // Session Replay (50/month on free)
  replaysOnErrorSampleRate: 1.0,  // 100% of error sessions
  replaysSessionSampleRate: 0,    // don't record normal sessions (save quota)

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      mask: ['[data-private]']    // mask sensitive fields
    })
  ],

  // Don't send errors from bots or crawlers
  beforeSend(event) {
    if (event.request?.headers?.['user-agent']?.includes('bot')) {
      return null
    }
    return event
  }
})
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1
})
```

---

## Critical Errors to Capture

These are the errors that kill the user experience. Sentry must catch all of them.

### 1. Webhook Processing Failure
```typescript
// app/api/stripe-webhook/route.ts
import * as Sentry from '@sentry/nextjs'

try {
  // process webhook
} catch (err) {
  Sentry.captureException(err, {
    tags: { service: 'webhook' },
    extra: {
      eventType: event?.type,
      sessionId: session?.id
    }
  })
  return new Response('Webhook error', { status: 500 })
}
```

### 2. Unlock Email Not Sent
```typescript
try {
  await resend.emails.send({ ... })
} catch (err) {
  Sentry.captureException(err, {
    tags: { service: 'email', type: 'unlock' },
    extra: { purchaseId, buyerEmail: maskEmail(buyerEmail) }
  })
  // Don't throw — log and alert, buyer can use /unlock-request
}
```

### 3. Purchase Record Not Created
```typescript
const { data, error } = await supabase
  .from('purchases')
  .insert({ ... })

if (error) {
  Sentry.captureException(new Error('Purchase insert failed'), {
    tags: { service: 'database' },
    extra: { supabaseError: error, stripeSessionId }
  })
  throw error
}
```

### 4. Token Validation Error
```typescript
try {
  // validate token
} catch (err) {
  Sentry.captureException(err, {
    tags: { service: 'unlock' },
    extra: { tokenHash: '[REDACTED]', purchaseId }
  })
}
```

### 5. Stripe Connect Onboarding Failure
```typescript
try {
  const accountLink = await stripe.accountLinks.create({ ... })
} catch (err) {
  Sentry.captureException(err, {
    tags: { service: 'stripe_connect' },
    extra: { sellerId }
  })
}
```

---

## User Context

Set seller context when authenticated so errors are traceable to a user.

```typescript
// After Supabase auth
import * as Sentry from '@sentry/nextjs'

Sentry.setUser({
  id: user.id,
  email: user.email   // Sentry masks this in UI by default
})

// On logout
Sentry.setUser(null)
```

Never set buyer as Sentry user — they have no accounts.

---

## Custom Tags

Use consistent tags so you can filter errors by service in Sentry dashboard.

```typescript
Sentry.setTag('service', 'webhook')      // webhook | checkout | unlock | auth | email
Sentry.setTag('stripe_event', event.type)
```

---

## Alerts

Set up these Sentry alerts immediately after launch:

| Alert | Condition | Why |
|---|---|---|
| Webhook failures | Any error in `service:webhook` | Payment received but not recorded |
| Email failures | Any error in `service:email` | Buyer paid but got nothing |
| Error spike | >10 errors in 5 minutes | Something is broken |
| New issue | First occurrence of any new error | Catch regressions fast |

Configure in Sentry → Alerts → Create Alert Rule.
Send to email or Slack.

---

## Source Maps

Source maps let Sentry show readable stack traces instead of minified code.
The wizard sets this up automatically via `SENTRY_AUTH_TOKEN`.

Verify it's working: deploy to production, trigger an error, check Sentry — stack trace should show your actual file names and line numbers.

---

## What NOT to Send to Sentry

```typescript
// Never include in Sentry extra/context:
// - destination_url (seller's private link)
// - unlock tokens or token hashes
// - full buyer emails (mask them)
// - Stripe secret keys
// - Supabase service role key

// Safe to include:
// - purchase IDs
// - link IDs (UUIDs, not slugs)
// - masked emails: h***@gmail.com
// - error codes and messages
// - Stripe session IDs (not secret)
```

---

## Local Development

Sentry is disabled in development (`enabled: process.env.NODE_ENV === 'production'`).

To test Sentry locally:

```typescript
// Temporarily override in sentry.client.config.ts
enabled: true,
debug: true   // logs to console instead of sending
```

Or use Sentry's test button: Sentry Dashboard → Your Project → Settings → Client Keys → Send Test Event.

---

## Rules

1. **Wrap all API routes in try/catch** — unhandled rejections in Next.js App Router don't always surface clearly
2. **Webhook errors must be captured** — a missed webhook = buyer paid and got nothing
3. **Never capture secrets** — redact tokens, keys, and full URLs before sending
4. **Set user context after auth** — makes debugging seller issues 10x faster
5. **Check Sentry before checking logs** — Sentry groups and deduplicates, raw logs don't
