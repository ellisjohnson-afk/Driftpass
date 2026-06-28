#!/usr/bin/env node
/**
 * Manually create an order voucher from a Stripe checkout session (recovery).
 * Usage: node scripts/sync-order-from-session.mjs cs_test_...
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
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).trim()
  }
  return env
}

const sessionId = process.argv[2]
if (!sessionId?.startsWith('cs_')) {
  console.error('Usage: node scripts/sync-order-from-session.mjs cs_...')
  process.exit(1)
}

const env = loadEnv()
const appUrl = (env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const res = await fetch(`${appUrl}/api/orders/fulfill`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: `sb-manual-sync=1`,
  },
  body: JSON.stringify({ sessionId }),
})

console.log('Status:', res.status)
console.log(await res.text())
console.log('\nNote: /api/orders/fulfill requires a logged-in user session.')
console.log('For local recovery, use Stripe dashboard session ID after deploy, or run fulfillment via Supabase + Stripe CLI.')
