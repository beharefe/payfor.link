# Revenue Strategy

## MVP Model — One Number

**4.5% per transaction. Nothing else.**

No monthly fees. No setup costs. No hidden charges.
You only earn when sellers earn.

---

## Fee Implementation

Collected via Stripe Connect `application_fee_amount`:

```typescript
payment_intent_data: {
  application_fee_amount: Math.round(price * 0.045 * 100), // in cents
  transfer_data: {
    destination: seller.stripe_account_id
  }
}
```

Stripe deducts the fee automatically. Platform never manually moves money.

---

## Seller Cost Breakdown

| Product Price | Platform Fee (4.5%) | Stripe Fee (~2.9% + $0.30) | Seller Receives |
|---|---|---|---|
| $5 | $0.23 | $0.45 | ~$4.32 |
| $10 | $0.45 | $0.59 | ~$8.96 |
| $25 | $1.13 | $1.03 | ~$22.85 |
| $50 | $2.25 | $1.75 | ~$46.00 |
| $100 | $4.50 | $3.20 | ~$92.30 |

Minimum price: $3.00 (enforced by DB constraint + UI validation)

---

## Competitive Position

| Platform | Fee |
|---|---|
| Gumroad | 10% |
| Lemon Squeezy | 5% |
| Paddle | ~5% |
| Ko-fi | 5% |
| **payfor.link** | **4.5%** |

Cheapest in market. Simple positioning: "We only take 4.5%."

---

## Revenue Projection

| Monthly GMV | Platform Revenue (4.5%) |
|---|---|
| $10,000 | $450 |
| $50,000 | $2,250 |
| $100,000 | $4,500 |
| $500,000 | $22,500 |

Early traction targets: 20 sellers, 100 purchases.

---

## Future Pricing (Post-Traction)

Introduce optional subscription tiers when sellers start hitting volume:

| Plan | Monthly | Fee |
|---|---|---|
| Free | $0 | 4.5% |
| Starter | $19 | 3% |
| Grow | $49 | 2% |
| Pro | $99 | 1% |

Dashboard prompt when upgrade is worth it:
> "You paid $72 in fees this month. Upgrade to Grow and save $24/month."

**Don't build tiers until data shows sellers want it.**

---

## Accounting Fields

Stored per purchase for accurate accounting:
- `purchases.platform_fee` — exact fee for each transaction
- `users.total_earned` — gross revenue (updated by webhook)
- `users.total_fees` — total platform fees collected
- `users.total_paid_out` — total withdrawn to bank

Balance calculation:
```
available = total_earned - total_fees - total_paid_out
```

Or query Stripe directly for exact real-time balance:
```typescript
stripe.balance.retrieve({}, { stripeAccount: seller.stripe_account_id })
```

---

## Core Principle

Platform earns only when sellers earn.
This alignment is the most important product decision.
