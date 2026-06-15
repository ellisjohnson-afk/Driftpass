#!/usr/bin/env node
/**
 * Verify Stripe price IDs are configured for fortnightly billing.
 * Run from driftpass/: node scripts/verify-stripe-prices.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Stripe from 'stripe'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

function loadEnv() {
  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
  }
  return env
}

const env = loadEnv()
const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

const PLANS = [
  {
    slug: 'membership',
    envKey: 'STRIPE_MEMBERSHIP_PRICE_ID',
    expectedCents: 799,
    weekly: true,
  },
  { slug: 'wanderer', envKey: 'STRIPE_WANDERER_PRICE_ID', expectedCents: 2000 },
  { slug: 'explorer', envKey: 'STRIPE_EXPLORER_PRICE_ID', expectedCents: 3500 },
  { slug: 'nomad', envKey: 'STRIPE_NOMAD_PRICE_ID', expectedCents: 5900 },
  { slug: 'van_lifer', envKey: 'STRIPE_VAN_LIFER_PRICE_ID', expectedCents: 2200 },
]

let ok = true

for (const plan of PLANS) {
  const priceId = env[plan.envKey]
  if (!priceId || priceId.startsWith('price_...')) {
    console.error(`✗ ${plan.slug}: missing ${plan.envKey}`)
    ok = false
    continue
  }

  const price = await stripe.prices.retrieve(priceId)
  const recurring = price.recurring
  const isWeekly =
    plan.weekly &&
    recurring?.interval === 'week' &&
    (recurring?.interval_count ?? 1) === 1
  const isFortnightly =
    !plan.weekly &&
    recurring?.interval === 'week' &&
    recurring?.interval_count === 2
  const amountOk = price.unit_amount === plan.expectedCents
  const intervalOk = isWeekly || isFortnightly

  if (intervalOk && amountOk) {
    const label = plan.weekly ? '/ week' : '/ 2 weeks'
    console.log(`✓ ${plan.slug}: A$${(price.unit_amount / 100).toFixed(2)} ${label} (${priceId})`)
  } else {
    ok = false
    const expected = plan.weekly ? 'weekly' : 'fortnightly'
    console.error(
      `✗ ${plan.slug}: expected A$${(plan.expectedCents / 100).toFixed(2)} ${expected}, got`,
      `${price.unit_amount} ${recurring?.interval}/${recurring?.interval_count}`
    )
  }
}

if (!env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_...')) {
  console.error('✗ STRIPE_WEBHOOK_SECRET not configured')
  ok = false
} else {
  console.log('✓ STRIPE_WEBHOOK_SECRET configured')
}

process.exit(ok ? 0 : 1)
