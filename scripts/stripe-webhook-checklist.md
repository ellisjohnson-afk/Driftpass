# Stripe webhook checklist (production / live mode)

Endpoint:

```
https://www.driftpass.com.au/api/stripe/webhook
```

**Important:** Live webhooks need a **live** signing secret (`whsec_...` from the live endpoint). Test and live secrets are different.

## Events to enable

| Event | Purpose |
|-------|---------|
| `checkout.session.completed` | Trip Help / tour purchases (`orderType=voucher`) + legacy subscriptions |
| `invoice.paid` | Legacy subscription renewals (`subscription_cycle`) |
| `customer.subscription.updated` | Plan status changes |
| `customer.subscription.deleted` | Cancellations |

Membership signups are **free** (no Stripe) — `checkout.session.completed` for subscriptions is only for legacy paid tiers.

## Vercel production env

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...    # from LIVE webhook endpoint
```

Legacy tier price IDs are optional (`STRIPE_WANDERER_PRICE_ID`, etc.). Trip Help uses dynamic Checkout prices — no product price env vars needed.

Run before deploy:

```bash
npm run stripe:go-live -- --expect-live
npm run vercel:env
npx vercel --prod
```

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Payment succeeds, no Trip Help order | Live webhook missing or wrong `STRIPE_WEBHOOK_SECRET` |
| HTTP 400 on webhook | Signing secret mismatch (test secret on live endpoint) |
| HTTP 500 | Handler error — check Vercel logs `[Webhook]` |
| Charges in test mode on production | `sk_test_` still set on Vercel — run `stripe:go-live` |

## Manual recovery

Admin → Trip Help orders → **Recover paid checkout** (paste `cs_live_...`).

Or Stripe Dashboard → resend `checkout.session.completed` for the session.
