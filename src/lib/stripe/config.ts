import Stripe from 'stripe'

// Stripe singleton — reused across module lifetime (important for Vercel cold starts)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
  appInfo: {
    name: 'DriftPass',
    version: '1.0.0',
    url: 'https://driftpass.com.au',
  },
})

// All DriftPass plans are billed bi-weekly (every 2 weeks).
// When creating prices in Stripe dashboard: Billing period → Every 2 weeks
// Or via API: { recurring: { interval: 'week', interval_count: 2 } }

// Map plan slugs to Stripe price IDs
export const STRIPE_PRICE_IDS = {
  membership: process.env.STRIPE_MEMBERSHIP_PRICE_ID!,
  wanderer: process.env.STRIPE_WANDERER_PRICE_ID!,
  explorer: process.env.STRIPE_EXPLORER_PRICE_ID!,
  nomad: process.env.STRIPE_NOMAD_PRICE_ID!,
  van_lifer: process.env.STRIPE_VAN_LIFER_PRICE_ID!,
} as const

export type PlanSlug = keyof typeof STRIPE_PRICE_IDS

// Topup credit packages (price in AUD cents, credits granted)
export const TOPUP_PACKAGES = [
  { credits: 20, price_aud_cents: 500,  label: '20 credits — A$5' },
  { credits: 50, price_aud_cents: 1000, label: '50 credits — A$10' },
  { credits: 100, price_aud_cents: 1800, label: '100 credits — A$18' },
] as const
