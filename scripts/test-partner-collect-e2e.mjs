#!/usr/bin/env node
/**
 * Partner collect E2E — creates a test order, collects via /api/partners/collect-pin,
 * verifies DB state + double-collect guard, then cleans up.
 *
 * Usage:
 *   node scripts/test-partner-collect-e2e.mjs
 *   node scripts/test-partner-collect-e2e.mjs https://www.driftpass.com.au
 */
import { randomInt } from 'crypto'
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

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

async function supabaseFetch(env, path, options = {}) {
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: options.prefer ?? 'return=representation',
    ...options.headers,
  }

  const res = await fetch(`${base}/rest/v1/${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // ignore
  }

  return { res, json, text }
}

async function generateUniquePin(env) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const pin = String(randomInt(100_000, 1_000_000))
    const { res, json } = await supabaseFetch(
      env,
      `order_vouchers?collection_pin=eq.${pin}&select=id`
    )
    if (!res.ok) fail(`Could not check PIN uniqueness: ${res.status}`)
    if (!json?.length) return pin
  }
  fail('Could not generate a unique collection PIN')
}

const env = loadEnv()
const appUrl = (process.argv[2] ?? env.NEXT_PUBLIC_APP_URL ?? 'https://www.driftpass.com.au').replace(
  /\/$/,
  ''
)

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  fail('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
}

console.log(`Partner collect E2E — ${appUrl}\n`)

let orderId = null

try {
  // 1. Scan page loads (partner terminal)
  const scanRes = await fetch(`${appUrl}/scan`)
  console.log(`${scanRes.ok ? '✓' : '✗'} /scan loads (${scanRes.status})`)
  if (!scanRes.ok) fail('/scan did not load')

  // 2. Resolve test user + partner
  const { res: profileRes, json: profiles } = await supabaseFetch(
    env,
    'profiles?select=id,full_name&limit=1'
  )
  if (!profileRes.ok || !profiles?.[0]?.id) fail('No profile found for test order')
  const userId = profiles[0].id
  const memberName = profiles[0].full_name ?? 'Test Member'

  const { res: partnerRes, json: partners } = await supabaseFetch(
    env,
    'partners?slug=eq.le-shack&select=id,name&limit=1'
  )
  if (!partnerRes.ok || !partners?.[0]?.id) fail('Partner le-shack not found')
  const partnerId = partners[0].id
  const partnerName = partners[0].name

  const collectionPin = await generateUniquePin(env)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const sessionId = `e2e_test_${Date.now()}`

  const { res: insertRes, json: inserted } = await supabaseFetch(env, 'order_vouchers', {
    method: 'POST',
    body: {
      user_id: userId,
      partner_id: partnerId,
      product_type: 'trip_help',
      product_slug: 'luggage-storage',
      product_name: 'Luggage Storage (E2E test)',
      amount_aud_cents: 400,
      collection_pin: collectionPin,
      status: 'paid',
      stripe_checkout_session_id: sessionId,
      expires_at: expiresAt,
    },
  })

  if (!insertRes.ok || !inserted?.[0]?.id) {
    fail(`Could not create test order: ${insertRes.status} ${JSON.stringify(inserted)}`)
  }

  orderId = inserted[0].id
  console.log(`✓ Created test order ${orderId} (PIN ${collectionPin.slice(0, 3)} ${collectionPin.slice(3)})`)

  // 3. Collect via API (what /scan calls)
  const collectRes = await fetch(`${appUrl}/api/partners/collect-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: collectionPin }),
  })
  const collectData = await collectRes.json()

  if (!collectRes.ok) {
    fail(`collect-pin failed: ${collectRes.status} ${JSON.stringify(collectData)}`)
  }

  const checks = [
    collectData.success === true,
    collectData.productName === 'Luggage Storage (E2E test)',
    collectData.amountAudCents === 400,
    collectData.partnerName === partnerName,
    typeof collectData.memberName === 'string' && collectData.memberName.length > 0,
  ]

  console.log(`${checks.every(Boolean) ? '✓' : '✗'} collect-pin success response`)
  if (!checks.every(Boolean)) {
    console.log('  Response:', collectData)
    fail('collect-pin response fields did not match')
  }
  console.log(`  → ${collectData.productName} · ${collectData.memberName} · $${(collectData.amountAudCents / 100).toFixed(2)}`)

  // 4. DB shows collected
  const { res: orderRes, json: orders } = await supabaseFetch(
    env,
    `order_vouchers?id=eq.${orderId}&select=status,collected_at`
  )
  const order = orders?.[0]
  const dbOk = order?.status === 'collected' && order?.collected_at
  console.log(`${dbOk ? '✓' : '✗'} order_vouchers.status = collected`)
  if (!dbOk) fail(`Expected collected, got ${JSON.stringify(order)}`)

  // 5. Double collect rejected
  const againRes = await fetch(`${appUrl}/api/partners/collect-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: collectionPin }),
  })
  const againData = await againRes.json()
  const doubleOk = againRes.status === 409 && againData.error?.includes('already collected')
  console.log(`${doubleOk ? '✓' : '✗'} double collect returns 409`)
  if (!doubleOk) fail(`Expected 409 on double collect, got ${againRes.status}`)

  // 6. Invalid PIN rejected
  const badRes = await fetch(`${appUrl}/api/partners/collect-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '000000' }),
  })
  const badData = await badRes.json()
  const badOk = badRes.status === 404 && badData.error?.includes('Invalid')
  console.log(`${badOk ? '✓' : '✗'} invalid PIN returns 404`)
  if (!badOk) fail(`Expected 404 for invalid PIN, got ${badRes.status}`)

  // 7. PIN with space formatting (as typed on /scan)
  // Reset order to paid for format test — only if we still have the row
  await supabaseFetch(env, `order_vouchers?id=eq.${orderId}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: { status: 'paid', collected_at: null },
  })

  const formattedPin = `${collectionPin.slice(0, 3)} ${collectionPin.slice(3)}`
  const fmtRes = await fetch(`${appUrl}/api/partners/collect-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: formattedPin }),
  })
  const fmtData = await fmtRes.json()
  console.log(`${fmtRes.ok && fmtData.success ? '✓' : '✗'} spaced PIN format accepted`)
  if (!fmtRes.ok || !fmtData.success) {
    fail(`Spaced PIN failed: ${fmtRes.status} ${JSON.stringify(fmtData)}`)
  }

  console.log('\n✓ Partner collect E2E passed')
} finally {
  if (orderId) {
    const { res } = await supabaseFetch(env, `order_vouchers?id=eq.${orderId}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    })
    if (res.ok) {
      console.log(`\nCleaned up test order ${orderId}`)
    } else {
      console.warn(`\nWarning: could not delete test order ${orderId} — delete manually`)
    }
  }
}
