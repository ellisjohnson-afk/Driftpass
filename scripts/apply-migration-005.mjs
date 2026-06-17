#!/usr/bin/env node
/**
 * Apply migration 005 data updates via Supabase service role.
 * For DDL (pin_shard column), run: npm run db:push (requires supabase login + link)
 * Run from driftpass/: node scripts/apply-migration-005.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

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

function userPinShard(userId, secret) {
  const hmac = createHmac('sha256', secret)
  hmac.update(`shard:${userId}`)
  const num = parseInt(hmac.digest('hex').slice(0, 4), 16) % 100
  return num.toString().padStart(2, '0')
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const planUpdates = [
  { slug: 'wanderer', price_aud_cents: 2000, credits_per_month: 25 },
  { slug: 'explorer', price_aud_cents: 3500, credits_per_month: 42 },
  { slug: 'nomad', price_aud_cents: 5900, credits_per_month: 70 },
  { slug: 'van_lifer', price_aud_cents: 2200, credits_per_month: 25 },
]

console.log('Applying plan updates...')
for (const plan of planUpdates) {
  const { error } = await supabase
    .from('plans')
    .update({ price_aud_cents: plan.price_aud_cents, credits_per_month: plan.credits_per_month })
    .eq('slug', plan.slug)
  if (error) console.error(`  ✗ ${plan.slug}:`, error.message)
  else console.log(`  ✓ ${plan.slug}`)
}

console.log('Fixing partner name...')
await supabase
  .from('partners')
  .update({ name: 'Airlie Beach Fit' })
  .eq('slug', 'airlie-beach-fit')

// Check pin_shard column
const { error: shardColError } = await supabase.from('subscriptions').select('pin_shard').limit(1)
if (shardColError?.message?.includes('pin_shard')) {
  console.error('\n✗ pin_shard column missing. Run migration 005 in Supabase SQL editor or:')
  console.error('  supabase login && supabase link --project-ref kxutuhifihgogrervsve && npm run db:push')
  process.exit(1)
}

console.log('Backfilling pin_shard on subscriptions...')
const { data: subs, error: subsError } = await supabase
  .from('subscriptions')
  .select('id, user_id, pin_shard')
  .is('pin_shard', null)

if (subsError) {
  console.error('✗', subsError.message)
  process.exit(1)
}

let backfilled = 0
for (const sub of subs ?? []) {
  const shard = userPinShard(sub.user_id, env.PIN_HMAC_SECRET)
  await supabase.from('subscriptions').update({ pin_shard: shard }).eq('id', sub.id)
  backfilled++
}
console.log(`  ✓ Backfilled ${backfilled} subscriptions`)

console.log('\nDone. Verify plans:')
const { data: plans } = await supabase.from('plans').select('slug, price_aud_cents, credits_per_month')
console.table(plans)
