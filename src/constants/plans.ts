import type { Plan } from '@/types'

// ============================================================
// DriftPass Plans — single source of truth
// All credit costs and prices defined here.
// Update Stripe price IDs in .env, not here.
// ============================================================

// All plans are billed every 2 weeks (bi-weekly).
// In Stripe: interval = 'week', interval_count = 2
export const PLANS: Plan[] = [
  {
    id: 'wanderer',
    name: 'Wanderer',
    slug: 'wanderer',
    price_aud_cents: 2000,          // A$20 / 2 weeks
    credits_per_month: 25,          // credits per 2-week period
    stripe_price_id: process.env.STRIPE_WANDERER_PRICE_ID ?? '',
    audience_type: 'backpacker',
    is_popular: false,
    features: [
      '25 credits / 2 weeks',
      'Gym + shower access',
      'Laundry access',
      'Café work sessions',
      'Luggage storage',
      'Restaurant discounts',
    ],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    slug: 'explorer',
    price_aud_cents: 3500,          // A$35 / 2 weeks
    credits_per_month: 42,          // credits per 2-week period
    stripe_price_id: process.env.STRIPE_EXPLORER_PRICE_ID ?? '',
    audience_type: 'backpacker',
    is_popular: true,
    features: [
      '42 credits / 2 weeks',
      'Everything in Wanderer',
      'Co-working access',
      'Flash Pass deals',
      'Tour discounts',
      'Priority partner booking',
    ],
  },
  {
    id: 'nomad',
    name: 'Nomad',
    slug: 'nomad',
    price_aud_cents: 5900,          // A$59 / 2 weeks
    credits_per_month: 70,          // credits per 2-week period
    stripe_price_id: process.env.STRIPE_NOMAD_PRICE_ID ?? '',
    audience_type: 'digital_nomad',
    is_popular: false,
    features: [
      '70 credits / 2 weeks',
      'Everything in Explorer',
      'Unlimited café sessions',
      'Community events',
      'Private call booth access',
      'Premium partner perks',
    ],
  },
  {
    id: 'van_lifer',
    name: 'Van Lifer',
    slug: 'van_lifer',
    price_aud_cents: 2200,          // A$22 / 2 weeks
    credits_per_month: 25,          // credits per 2-week period
    stripe_price_id: process.env.STRIPE_VAN_LIFER_PRICE_ID ?? '',
    audience_type: 'van_lifer',
    is_popular: false,
    features: [
      '25 credits / 2 weeks',
      'Water tank refills',
      'Shower access',
      'Overnight pitch locations',
      'Mechanic network',
      'Kitchen access',
      'EV charging points',
    ],
  },
]

export const PLAN_BY_SLUG = Object.fromEntries(
  PLANS.map((p) => [p.slug, p])
) as Record<string, Plan>

// Dynamic lookup — evaluated at call time so env vars are populated
export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find((p) => p.stripe_price_id === priceId)
}

export const PLAN_BY_PRICE_ID = new Proxy({} as Record<string, Plan>, {
  get(_target, priceId: string) {
    return getPlanByPriceId(priceId)
  },
})
