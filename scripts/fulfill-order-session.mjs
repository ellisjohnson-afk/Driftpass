#!/usr/bin/env node
/**
 * Recover a Trip Help order from a Stripe checkout session ID.
 * Usage: node scripts/fulfill-order-session.mjs cs_live_...
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
  console.error('Usage: node scripts/fulfill-order-session.mjs cs_...')
  process.exit(1)
}

const env = loadEnv()
const adminSecret = env.ADMIN_SECRET
const appUrl = (env.NEXT_PUBLIC_APP_URL ?? 'https://www.driftpass.com.au').replace(/\/$/, '')

if (!adminSecret) {
  console.error('Missing ADMIN_SECRET in .env.local')
  process.exit(1)
}

const res = await fetch(`${appUrl}/api/admin/fulfill-order`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': adminSecret,
  },
  body: JSON.stringify({ sessionId }),
})

const text = await res.text()
console.log(res.status, text)

if (res.ok) {
  try {
    const { data } = JSON.parse(text)
    if (data?.id) {
      console.log(`\nReceipt: ${appUrl}/trip-help/orders/${data.id}`)
      console.log(`Collection PIN: ${data.collection_pin}`)
    }
  } catch {
    // ignore
  }
}

process.exit(res.ok ? 0 : 1)
