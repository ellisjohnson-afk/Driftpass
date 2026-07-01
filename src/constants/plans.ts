import type { Plan, PlanSlug } from '@/types'

// ============================================================
// DriftPass Plans
// V2: single weekly membership for new signups.
// Legacy fortnightly tiers remain for existing subscribers + ?plan= URLs.
// Update Stripe price IDs in .env, not here.
// ============================================================

export const MEMBERSHIP_INCLUSIONS = [
  'Free digital pass — no card required',
  'Member discounts at founding partners',
  'Trip Help — luggage, showers, WiFi & more',
  'Tours, activities & local experiences',
  'Airlie Beach welcome guide & local FAQ',
  'Rotating pass PIN for partner check-in',
  'Featured local businesses & shoutouts',
] as const

/** V2 default — free membership; revenue via Trip Help upsells */
export const MEMBERSHIP_PLAN: Plan = {
  id: 'membership',
  name: 'Drift Pass Membership',
  slug: 'membership',
  price_aud_cents: 0,
  credits_per_month: 0,
  stripe_price_id: process.env.STRIPE_MEMBERSHIP_PRICE_ID ?? '',
  audience_type: 'backpacker',
  billing_period: 'week',
  is_popular: true,
  features: [...MEMBERSHIP_INCLUSIONS],
}

/** V1 fortnightly tiers — grandfathered; still resolvable via webhook + ?plan= checkout */
export const LEGACY_PLANS: Plan[] = [
  {
    id: 'wanderer',
    name: 'Wanderer',
    slug: 'wanderer',
    price_aud_cents: 2000,
    credits_per_month: 25,
    stripe_price_id: process.env.STRIPE_WANDERER_PRICE_ID ?? '',
    audience_type: 'backpacker',
    billing_period: 'fortnight',
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
    price_aud_cents: 3500,
    credits_per_month: 42,
    stripe_price_id: process.env.STRIPE_EXPLORER_PRICE_ID ?? '',
    audience_type: 'backpacker',
    billing_period: 'fortnight',
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
    price_aud_cents: 5900,
    credits_per_month: 70,
    stripe_price_id: process.env.STRIPE_NOMAD_PRICE_ID ?? '',
    audience_type: 'digital_nomad',
    billing_period: 'fortnight',
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
    price_aud_cents: 2200,
    credits_per_month: 25,
    stripe_price_id: process.env.STRIPE_VAN_LIFER_PRICE_ID ?? '',
    audience_type: 'van_lifer',
    billing_period: 'fortnight',
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

/** All plans — used for slug/price lookups (webhooks, legacy checkout) */
export const ALL_PLANS: Plan[] = [MEMBERSHIP_PLAN, ...LEGACY_PLANS]

/** @deprecated Use ALL_PLANS — kept for imports that expect PLANS */
export const PLANS = ALL_PLANS

export const PLAN_BY_SLUG = Object.fromEntries(
  ALL_PLANS.map((p) => [p.slug, p])
) as Record<PlanSlug, Plan>

export const LEGACY_PLAN_SLUGS = LEGACY_PLANS.map((p) => p.slug)

export function isLegacyPlanSlug(slug: string): slug is Exclude<PlanSlug, 'membership'> {
  return slug !== 'membership' && slug in PLAN_BY_SLUG
}

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return ALL_PLANS.find((p) => p.stripe_price_id === priceId)
}

export const PLAN_BY_PRICE_ID = new Proxy({} as Record<string, Plan>, {
  get(_target, priceId: string) {
    return getPlanByPriceId(priceId)
  },
})
