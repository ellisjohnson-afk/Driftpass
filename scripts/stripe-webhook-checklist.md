# Stripe webhook checklist (production)

Endpoint (live mode):

```
https://www.driftpass.com.au/api/stripe/webhook
```

Events to enable:

- `checkout.session.completed` — creates subscription row + initial credits
- `invoice.paid` — renewals only (`subscription_cycle`)
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Vercel Production env

Must match **live** Stripe webhook signing secret:

```
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_live_...   (or sk_test_... in test mode — webhook secret must match same mode)
```

If payment succeeds but account shows "No active pass yet", check Stripe → Webhooks → event delivery:

| Symptom | Likely cause |
|---------|----------------|
| No events | Webhook endpoint not configured or wrong mode (test vs live) |
| HTTP 400 | `STRIPE_WEBHOOK_SECRET` mismatch |
| HTTP 500 | Handler error — see Vercel function logs `[Webhook]` |
| HTTP 200 but no row | Previously swallowed errors; redeploy fixes logging + 500 retry |

## After successful `checkout.session.completed`

Supabase should have:

1. `subscriptions` row — `status` = `active` or `trialing`, `stripe_subscription_id` set
2. `credit_transactions` row — type `credit`, amount = plan `credits_per_month`

Metadata on Checkout session (all plans):

```json
{
  "userId": "<supabase auth uuid>",
  "planSlug": "membership|wanderer|explorer|nomad|van_lifer",
  "planId": "<plans.id uuid>"
}
```

Plan resolution is dynamic — slug from metadata, subscription metadata, Stripe price ID env mapping, or `planId` fallback.

## Manual replay (failed user)

In Stripe Dashboard → Payments → find Checkout session → **Resend** `checkout.session.completed` after deploy.

Or Stripe CLI:

```bash
stripe events resend evt_...
```
