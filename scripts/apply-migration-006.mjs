#!/usr/bin/env node
/**
 * Insert the V2 membership plan into public.plans.
 * For the credits_per_month constraint change, run the SQL in
 * supabase/migrations/006_v2_membership_plan.sql via Supabase SQL editor
 * if upsert fails with a check constraint error.
 *
 * Run: npm run db:apply-006
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

function loadEnv() {
  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).split(' ')[0]
  }
  return env
}

const env = loadEnv()
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const stripePriceId = env.STRIPE_MEMBERSHIP_PRICE_ID

if (!baseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

if (!stripePriceId) {
  console.error('Missing STRIPE_MEMBERSHIP_PRICE_ID in .env.local')
  process.exit(1)
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
}

const membershipPlan = {
  name: 'Drift Pass Membership',
  slug: 'membership',
  price_aud_cents: 799,
  credits_per_month: 0,
  stripe_price_id: stripePriceId,
  audience_type: 'backpacker',
  is_active: true,
}

console.log('Upserting membership plan...')

const upsertRes = await fetch(`${baseUrl}/rest/v1/plans?on_conflict=slug`, {
  method: 'POST',
  headers,
  body: JSON.stringify(membershipPlan),
})

if (!upsertRes.ok) {
  const body = await upsertRes.text()
  console.error('✗ Failed:', upsertRes.status, body)
  if (body.includes('credits_per_month')) {
    console.error('\nRun this in Supabase → SQL editor, then retry:')
    console.error(readFileSync(resolve(__dirname, '../supabase/migrations/006_v2_membership_plan.sql'), 'utf8'))
  }
  process.exit(1)
}

const saved = await upsertRes.json()
console.log('✓ membership plan ready')
console.log(`  stripe_price_id: ${stripePriceId}`)

const listRes = await fetch(
  `${baseUrl}/rest/v1/plans?select=slug,name,price_aud_cents,credits_per_month,stripe_price_id,is_active&order=slug`,
  { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
)

if (listRes.ok) {
  const plans = await listRes.json()
  console.log('\nPlans in database:')
  console.table(plans)
} else {
  console.log('\nSaved row:', saved)
}
