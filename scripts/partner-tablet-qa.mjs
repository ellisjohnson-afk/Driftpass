#!/usr/bin/env node
/**
 * Partner tablet QA — automated API checks + manual checklist for /scan.
 *
 * Usage:
 *   npm run test:partner-qa
 *   node scripts/partner-tablet-qa.mjs https://www.driftpass.com.au
 */
import { createHmac } from 'crypto'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const SCAN_URL = 'https://www.driftpass.com.au/scan'

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

const env = loadEnv()
const appUrl = (process.argv[2] ?? env.NEXT_PUBLIC_APP_URL ?? 'https://www.driftpass.com.au').replace(
  /\/$/,
  ''
)

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const pinSecret = env.PIN_HMAC_SECRET

if (!supabaseUrl || !serviceKey) {
  fail('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
}
if (!pinSecret) {
  fail('Missing PIN_HMAC_SECRET in .env.local')
}

const PIN_WINDOW_MS = 60_000

function pinWindow(offset = 0) {
  return Math.floor(Date.now() / PIN_WINDOW_MS) + offset
}

function userPinShard(userId) {
  const hmac = createHmac('sha256', pinSecret)
  hmac.update(`shard:${userId}`)
  return (parseInt(hmac.digest('hex').slice(0, 4), 16) % 100).toString().padStart(2, '0')
}

function pinForWindow(userId, subscriptionId, window) {
  const shard = userPinShard(userId)
  const hmac = createHmac('sha256', pinSecret)
  hmac.update(`${userId}:${subscriptionId}:${window}`)
  const num = parseInt(hmac.digest('hex').slice(0, 6), 16) % 10_000
  return shard + num.toString().padStart(4, '0')
}

function formatPin(pin) {
  return pin.length > 3 ? `${pin.slice(0, 3)} ${pin.slice(3)}` : pin
}

async function supabaseFetch(path) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })
  const json = res.ok ? await res.json() : null
  return { res, json }
}

console.log(`Partner tablet QA — ${appUrl}\n`)

let passed = 0
let total = 0

function check(ok, label, detail = '') {
  total += 1
  if (ok) passed += 1
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) return false
  return true
}

// 1. Scan page loads (partner tablet bookmark target)
const scanRes = await fetch(`${appUrl}/scan`)
check(scanRes.ok, '/scan loads on partner tablet URL', `HTTP ${scanRes.status}`)

// 2. Invalid member PIN rejected
const badMember = await fetch(`${appUrl}/api/partners/verify-pin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pin: '000000' }),
})
const badMemberData = await badMember.json()
check(
  badMember.status === 401 && badMemberData.error,
  'Verify member rejects invalid PIN',
  `HTTP ${badMember.status}`
)

// 3. Invalid collection PIN rejected
const badCollect = await fetch(`${appUrl}/api/partners/collect-pin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pin: '000000' }),
})
const badCollectData = await badCollect.json()
check(
  badCollect.status === 404 && badCollectData.error,
  'Collect order rejects invalid PIN',
  `HTTP ${badCollect.status}`
)

// 4. Live member PIN verify (uses production PIN_HMAC_SECRET + active subscription)
const { res: subRes, json: subs } = await supabaseFetch(
  'subscriptions?select=id,user_id,status,profiles(full_name),plans(name)&status=in.(active,trialing)&order=created_at.desc&limit=1'
)

if (!subRes.ok || !subs?.[0]) {
  check(false, 'Active subscription found for member PIN test')
} else {
  const sub = subs[0]
  const profile = sub.profiles
  const plan = sub.plans
  const pin = pinForWindow(sub.user_id, sub.id, pinWindow(0))
  const spacedPin = formatPin(pin)

  const verifyRes = await fetch(`${appUrl}/api/partners/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: spacedPin }),
  })
  const verifyData = await verifyRes.json()

  check(
    verifyRes.ok && verifyData.success && verifyData.memberName,
    'Verify member accepts live membership PIN',
    `${verifyData.memberName ?? '?'} · ${verifyData.planName ?? 'plan'}`
  )

  const expiresIn = PIN_WINDOW_MS - (Date.now() % PIN_WINDOW_MS)
  console.log(`  PIN for manual tablet test: ${spacedPin} (refreshes in ~${Math.ceil(expiresIn / 1000)}s)`)
  console.log(`  Member: ${profile?.full_name ?? 'DriftPass Member'}`)
}

// 5. Collect E2E (creates test order, collects, cleans up)
console.log('\nRunning collection PIN E2E…')
const collectRun = spawnSync('node', [resolve(__dirname, 'test-partner-collect-e2e.mjs'), appUrl], {
  stdio: 'inherit',
  env: process.env,
})

if (collectRun.status === 0) {
  passed += 1
  total += 1
  console.log('✓ Collect order E2E passed')
} else {
  total += 1
  console.log('✗ Collect order E2E failed')
}

console.log(`\n${passed}/${total} automated partner QA checks passed`)

console.log(`
────────────────────────────────────────────────────────────
MANUAL TABLET QA (do this at the counter)
────────────────────────────────────────────────────────────

Partner tablet setup
  1. Open Safari/Chrome on the counter tablet
  2. Go to: ${SCAN_URL}
  3. Add to Home Screen / bookmark as "DriftPass Scan"

Test A — Verify member (membership perk)
  1. On YOUR phone: open DriftPass → My Pass
  2. Note the 6-digit PIN (refreshes every 60s)
  3. On TABLET: Collect order tab OFF → Verify member tab
  4. Type the PIN (spaces OK) → Confirm
  5. Expect: green "Active member" + your name + plan
  6. Partner applies agreed discount/perk — no credits in app

Test B — Collect order (paid Trip Help add-on)
  1. On YOUR phone: Trip Help → buy luggage/showers/etc (test mode OK)
  2. Open receipt / My purchases → note collection PIN
  3. On TABLET: Collect order tab
  4. Enter collection PIN → Confirm collected
  5. Expect: product name + your name + amount
  6. On phone: order shows "Done"
  7. Enter same PIN again → "already collected" error

Test C — Wrong PIN handling
  1. Enter 000 000 on either tab
  2. Expect: red "Not accepted" with clear error message
  3. Tap "Next customer →" to reset

Partners to run Test A with
  • Le Shack (storage, showers, hire)
  • Frequent-Seas (coworking, water, coffee)
  • Airlie Beach Fit (gym)
  • Frozen Yogurt Place (food perk)

Done when each partner staff member has run Test A once on the tablet.
────────────────────────────────────────────────────────────
`)

process.exit(passed === total ? 0 : 1)
