#!/usr/bin/env node
/**
 * Push env vars from .env.local to Vercel Production.
 *
 * Usage (from driftpass/):
 *   node scripts/sync-vercel-env.mjs
 *   node scripts/sync-vercel-env.mjs --dry-run
 *
 * Requires: Vercel CLI logged in (`npx vercel login`) and project linked (`npx vercel link`).
 * Or set VERCEL_TOKEN and VERCEL_PROJECT_ID.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const ENV_FILE = resolve(ROOT, '.env.local')
const DRY_RUN = process.argv.includes('--dry-run')

/** Production canonical URL — must match Supabase Site URL + redirect. */
const PRODUCTION_APP_URL = 'https://www.driftpass.com.au'

const KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_MEMBERSHIP_PRICE_ID',
  'STRIPE_WANDERER_PRICE_ID',
  'STRIPE_EXPLORER_PRICE_ID',
  'STRIPE_NOMAD_PRICE_ID',
  'STRIPE_VAN_LIFER_PRICE_ID',
  'PIN_HMAC_SECRET',
  'ADMIN_SECRET',
  'NEXT_PUBLIC_PHASE',
  'NEXT_PUBLIC_APP_URL',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'RESEND_FROM_NAME',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]

function parseEnvFile(path) {
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    const commentIdx = value.indexOf(' #')
    if (commentIdx !== -1) value = value.slice(0, commentIdx).trim()
    env[key] = value
  }
  return env
}

function isPlaceholder(value) {
  if (!value) return true
  if (value === '...' || value.endsWith('...')) return true
  if (value === 'change-me-to-a-random-64-char-hex-string') return true
  if (value.startsWith('re_...')) return true
  if (value === 'https://...') return true
  if (value.startsWith('pk.eyJ...')) return true
  if (value.startsWith('sk_live_...') || value.startsWith('sk_test_...')) return true
  if (value.startsWith('price_...')) return true
  return false
}

function getVercelBin() {
  const local = resolve(ROOT, 'node_modules/.bin/vercel')
  if (existsSync(local)) return local
  return 'npx'
}

function runVercel(args, input) {
  const bin = getVercelBin()
  const cmd = bin === 'npx' ? ['npx', 'vercel@latest', ...args] : [bin, ...args]
  return spawnSync(cmd[0], cmd.slice(1), {
    cwd: ROOT,
    input,
    stdio: ['pipe', 'inherit', 'inherit'],
    encoding: 'utf8',
  })
}

function upsertEnv(key, value) {
  if (DRY_RUN) {
    console.log(`→ would sync ${key}`)
    return true
  }
  // Try update first; add if missing
  let result = runVercel(['env', 'update', key, 'production', '--yes'], value)
  if (result.status === 0) {
    console.log(`✓ updated ${key}`)
    return true
  }
  result = runVercel(['env', 'add', key, 'production', '--force', '--yes'], value)
  if (result.status === 0) {
    console.log(`✓ added ${key}`)
    return true
  }
  console.error(`✗ failed ${key} (exit ${result.status})`)
  return false
}

if (!existsSync(ENV_FILE)) {
  console.error('Missing .env.local — copy from .env.example and fill in values.')
  process.exit(1)
}

const env = parseEnvFile(ENV_FILE)
env.NEXT_PUBLIC_APP_URL = PRODUCTION_APP_URL

console.log(`Syncing to Vercel Production (APP_URL=${PRODUCTION_APP_URL})`)
if (DRY_RUN) console.log('Dry run — no changes will be made.\n')

let synced = 0
let skipped = 0

for (const key of KEYS) {
  const value = env[key]
  if (isPlaceholder(value)) {
    console.log(`- skip ${key} (empty or placeholder in .env.local)`)
    skipped++
    continue
  }
  upsertEnv(key, value)
  synced++
}

console.log(`\nDone: ${synced} synced, ${skipped} skipped.`)
console.log('\nNext steps:')
console.log('  1. In Stripe → Webhooks, confirm endpoint:')
console.log(`     ${PRODUCTION_APP_URL}/api/stripe/webhook`)
console.log('     Update STRIPE_WEBHOOK_SECRET on Vercel if the production secret differs from local.')
console.log('  2. Supabase → Authentication → URL Configuration:')
console.log(`     Site URL: ${PRODUCTION_APP_URL}`)
console.log(`     Redirect URLs: ${PRODUCTION_APP_URL}/callback`)
console.log('  3. Redeploy: npx vercel --prod')
console.log(`  4. Test: ${PRODUCTION_APP_URL}/login`)
