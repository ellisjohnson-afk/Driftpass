#!/usr/bin/env node
/**
 * Stripe live-mode readiness check for DriftPass.
 *
 * Usage:
 *   node scripts/stripe-go-live.mjs
 *   node scripts/stripe-go-live.mjs --expect-live
 *
 * Put live keys in .env.local first, then:
 *   npm run stripe:go-live
 *   npm run vercel:env
 *   npx vercel --prod
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Stripe from 'stripe'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ENV_PATH = resolve(__dirname, '../.env.local')
const WEBHOOK_URL = 'https://www.driftpass.com.au/api/stripe/webhook'
const EXPECT_LIVE = process.argv.includes('--expect-live')

const REQUIRED_EVENTS = [
  'checkout.session.completed',
  'invoice.paid',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]

const LEGACY_PRICE_KEYS = [
  { slug: 'wanderer', envKey: 'STRIPE_WANDERER_PRICE_ID' },
  { slug: 'explorer', envKey: 'STRIPE_EXPLORER_PRICE_ID' },
  { slug: 'nomad', envKey: 'STRIPE_NOMAD_PRICE_ID' },
  { slug: 'van_lifer', envKey: 'STRIPE_VAN_LIFER_PRICE_ID' },
]

function loadEnv() {
  const env = {}
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).trim()
  }
  return env
}

function isPlaceholder(value) {
  if (!value) return true
  if (value.endsWith('...')) return true
  return false
}

function keyMode(prefix, value) {
  if (!value) return 'missing'
  if (value.startsWith(`${prefix}live_`)) return 'live'
  if (value.startsWith(`${prefix}test_`)) return 'test'
  return 'unknown'
}

const env = loadEnv()
let ok = true
const secret = env.STRIPE_SECRET_KEY
const publishable = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const webhookSecret = env.STRIPE_WEBHOOK_SECRET
const secretMode = keyMode('sk_', secret)
const publishableMode = keyMode('pk_', publishable)

console.log('DriftPass — Stripe go-live check\n')

if (!secret || isPlaceholder(secret)) {
  console.error('✗ STRIPE_SECRET_KEY missing in .env.local')
  process.exit(1)
}

if (EXPECT_LIVE && secretMode !== 'live') {
  console.error('✗ Expected sk_live_... key (use --expect-live only after adding live keys)')
  ok = false
}

console.log(`• Secret key mode: ${secretMode}`)
console.log(`• Publishable key mode: ${publishableMode}`)

if (secretMode !== publishableMode && publishableMode !== 'missing') {
  console.error('✗ Secret and publishable keys must both be live or both be test')
  ok = false
} else {
  console.log('✓ Secret and publishable key modes match')
}

if (isPlaceholder(webhookSecret)) {
  console.error('✗ STRIPE_WEBHOOK_SECRET missing')
  ok = false
} else {
  console.log('✓ STRIPE_WEBHOOK_SECRET configured')
}

const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })

try {
  const account = await stripe.accounts.retrieve()
  console.log(`✓ Stripe API connected — ${account.settings?.dashboard?.display_name ?? account.id}`)
  if (!account.charges_enabled) {
    console.warn('⚠ Charges not enabled yet — complete Stripe account activation')
  }
  if (!account.payouts_enabled) {
    console.warn('⚠ Payouts not enabled yet — required before paying partners')
  }
} catch (error) {
  console.error('✗ Could not connect to Stripe API:', error.message)
  ok = false
}

console.log('\nTrip Help / marketplace')
console.log('✓ Uses dynamic Checkout prices — no live price IDs required in env')

console.log('\nLegacy subscription prices (optional)')
let legacyConfigured = 0
for (const plan of LEGACY_PRICE_KEYS) {
  const priceId = env[plan.envKey]
  if (isPlaceholder(priceId)) {
    console.log(`- ${plan.slug}: not configured (ok — membership is free)`)
    continue
  }
  try {
    const price = await stripe.prices.retrieve(priceId)
    if (!price.active) {
      console.warn(`⚠ ${plan.slug}: price ${priceId} is inactive in Stripe`)
    } else {
      console.log(`✓ ${plan.slug}: ${priceId}`)
      legacyConfigured++
    }
  } catch {
    console.error(`✗ ${plan.slug}: invalid price ${priceId}`)
    ok = false
  }
}

console.log('\nWebhook endpoint')
try {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 })
  const match = endpoints.data.find((endpoint) => endpoint.url === WEBHOOK_URL)

  if (!match) {
    console.error(`✗ No webhook for ${WEBHOOK_URL}`)
    console.error('  Create in Stripe Dashboard → Developers → Webhooks (LIVE mode)')
    ok = false
  } else {
    const enabled = new Set(match.enabled_events)
    const missing = REQUIRED_EVENTS.filter((event) => !enabled.has(event))
    console.log(`✓ Webhook endpoint found (${match.status})`)
    if (missing.length) {
      console.error(`✗ Missing events: ${missing.join(', ')}`)
      ok = false
    } else {
      console.log(`✓ Required events enabled`)
    }
    if (secretMode === 'live' && match.livemode === false) {
      console.error('✗ Webhook is in TEST mode but keys are LIVE — create a live webhook')
      ok = false
    }
    if (secretMode === 'test' && match.livemode === true) {
      console.error('✗ Webhook is LIVE but keys are TEST')
      ok = false
    }
  }
} catch (error) {
  console.warn('⚠ Could not list webhooks:', error.message)
}

console.log('\nDeploy checklist')
console.log(`1. Stripe Dashboard → toggle LIVE mode`)
console.log(`2. Developers → API keys → copy sk_live_ and pk_live_ into .env.local`)
console.log(`3. Developers → Webhooks → Add endpoint:`)
console.log(`   ${WEBHOOK_URL}`)
console.log(`   Events: ${REQUIRED_EVENTS.join(', ')}`)
console.log(`4. Copy signing secret → STRIPE_WEBHOOK_SECRET in .env.local`)
console.log('5. npm run stripe:go-live -- --expect-live')
console.log('6. npm run vercel:env')
console.log('7. npx vercel --prod')
console.log('8. Stripe → Webhooks → Send test webhook (live) → expect HTTP 200')
console.log('9. Real test: buy a cheap Trip Help item on www.driftpass.com.au')

process.exit(ok ? 0 : 1)
