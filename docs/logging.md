# Logging Strategy

## Philosophy

Structured logging only. No `console.log` in production.
Every log entry is a JSON object with consistent fields.
Logs must be actionable — if you wouldn't act on it, don't log it.

---

## Log Levels

| Level | When to use |
|---|---|
| `info` | Normal operations worth recording (payment received, email sent) |
| `warn` | Unexpected but non-breaking (webhook retry, validation failed) |
| `error` | Something broke and needs attention |
| `debug` | Local development only, never in production |

---

## Log Structure

Every log entry must include:

```typescript
{
  level: 'info' | 'warn' | 'error',
  message: string,
  service: string,        // which part of the app: 'webhook' | 'checkout' | 'unlock' | 'auth'
  timestamp: string,      // ISO 8601
  requestId?: string,     // trace across a request lifecycle
  userId?: string,        // seller id if authenticated
  linkId?: string,        // link involved
  purchaseId?: string,    // purchase involved
  error?: {
    message: string,
    stack?: string,
    code?: string
  },
  meta?: Record<string, unknown>  // anything else relevant
}
```

---

## Log Provider

**Axiom** — free tier: 500MB/day, 30-day retention, built for Vercel + Next.js.

Register at axiom.co → New Dataset → copy dataset name and token.

```bash
npm install next-axiom pino pino-pretty
```

```env
NEXT_PUBLIC_AXIOM_DATASET=
NEXT_PUBLIC_AXIOM_TOKEN=
```

```typescript
// next.config.ts — wrap with Axiom
import { withAxiom } from 'next-axiom'
export default withAxiom({ /* your config */ })
```

next-axiom automatically ships all stdout JSON logs to Axiom in production. No extra transport config needed.

---

## Logger Setup

```bash
npm install pino pino-pretty
```

```typescript
// lib/logger.ts
import pino from 'pino'

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  }),
  base: {
    env: process.env.NODE_ENV,
    service: 'payfor-link'
  }
})

export default logger
```

---

## Usage Patterns

### API Route
```typescript
// app/api/stripe-webhook/route.ts
import logger from '@/lib/logger'

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  const log = logger.child({ service: 'webhook', requestId })

  log.info('Webhook received')

  try {
    // verify signature
    log.info({ eventType: event.type }, 'Webhook event parsed')

    if (event.type === 'checkout.session.completed') {
      log.info({ sessionId: session.id, buyerEmail: session.customer_email }, 'Payment confirmed')
      // create purchase
      log.info({ purchaseId }, 'Purchase record created')
      // send email
      log.info({ purchaseId, buyerEmail }, 'Unlock email sent')
    }

  } catch (err) {
    log.error({ err }, 'Webhook processing failed')
    return new Response('Webhook error', { status: 500 })
  }
}
```

### Checkout Creation
```typescript
const log = logger.child({ service: 'checkout', linkId })

log.info({ price, sellerId }, 'Checkout session creating')
// ... create session
log.info({ sessionId }, 'Checkout session created')
```

### Unlock Flow
```typescript
const log = logger.child({ service: 'unlock', purchaseId })

log.info('Token validation started')

if (tokenExpired) {
  log.warn({ tokenId }, 'Unlock token expired')
  return // handle expired
}

if (tokenUsed) {
  log.warn({ tokenId }, 'Unlock token already used')
  return // handle used
}

log.info({ deliveryUrl: masked }, 'Unlock successful — redirecting')
```

---

## What to Log

### Always log
- Payment received (`checkout.session.completed`)
- Purchase record created
- Unlock email sent
- Unlock token validated
- Unlock token expired or used
- Stripe Connect onboarding completed
- Link suspended (abuse)
- Webhook signature verification failed

### Never log
- Full destination URLs (seller's private links)
- Full buyer emails in production (mask: `h***@gmail.com`)
- Stripe secret keys or webhook secrets
- Any PII beyond what's listed above

---

## Masking Sensitive Data

```typescript
// lib/logger.ts — add redaction
const logger = pino({
  redact: {
    paths: ['destination_url', 'token', 'token_hash'],
    censor: '[REDACTED]'
  }
})

// Mask email manually where needed
const maskEmail = (email: string) => {
  const [user, domain] = email.split('@')
  return `${user[0]}***@${domain}`
}
```

---

## Request ID Tracing

Pass a `requestId` through the full lifecycle of each request so you can trace a payment end-to-end in logs.

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'

export function middleware(request: Request) {
  const requestId = uuid()
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  return response
}
```

```typescript
// In any API route
const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID()
const log = logger.child({ requestId })
```

---

## Axiom Dashboard (Production)

Axiom captures all pino JSON stdout automatically via next-axiom.

What you get out of the box:
- Full-text search across all log fields
- Filter by `service`, `level`, `requestId`, `purchaseId`
- 30-day retention on free tier (500MB/day)
- Alerts on error spikes

No Vercel Log Drains needed — next-axiom handles shipping directly.

**Vercel runtime logs** (1hr Hobby / 1day Pro) are still useful for quick live debugging during deploys. Use Axiom for historical search.

---

## Rules

1. Never use `console.log` — use `logger.info`
2. Always use child loggers with service context
3. Log at the start AND end of critical operations (webhook, unlock)
4. Errors must include the full `err` object: `log.error({ err }, 'message')`
5. Never log secrets, tokens, or full destination URLs
