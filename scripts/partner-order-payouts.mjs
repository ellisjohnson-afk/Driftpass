#!/usr/bin/env node
/**
 * Trip Help partner payout report — what to pay each partner for collected orders.
 *
 * Usage:
 *   npm run orders:partner-payouts
 *   node scripts/partner-order-payouts.mjs --partner le-shack
 *   node scripts/partner-order-payouts.mjs --status collected
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

function aud(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

const args = process.argv.slice(2)
const partnerSlug = args.includes('--partner') ? args[args.indexOf('--partner') + 1] : null
const status = args.includes('--status') ? args[args.indexOf('--status') + 1] : 'all'

const env = loadEnv()
const base = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!base || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
}

let url =
  `${base}/rest/v1/order_vouchers?select=id,product_name,product_slug,amount_aud_cents,partner_payout_cents,platform_fee_cents,status,collected_at,created_at,partners(name,slug)&partner_id=not.is.null&order=created_at.desc&limit=500`

if (status !== 'all') {
  url += `&status=eq.${status}`
}

const res = await fetch(url, { headers })
if (!res.ok) {
  console.error('Query failed:', res.status, await res.text())
  console.error('\n→ Run supabase/migrations/014_order_voucher_payouts.sql in SQL editor first.')
  process.exit(1)
}

let rows = await res.json()

if (partnerSlug) {
  rows = rows.filter((row) => row.partners?.slug === partnerSlug)
}

if (rows.length === 0) {
  console.log('No Trip Help orders found.')
  process.exit(0)
}

const byPartner = new Map()

for (const row of rows) {
  const slug = row.partners?.slug ?? 'unknown'
  const name = row.partners?.name ?? 'Unknown partner'
  const summary = byPartner.get(slug) ?? {
    name,
    slug,
    orders: 0,
    collected: 0,
    gross: 0,
    payout: 0,
    platform: 0,
    payable: 0,
  }

  summary.orders += 1
  summary.gross += row.amount_aud_cents ?? 0
  summary.payout += row.partner_payout_cents ?? 0
  summary.platform += row.platform_fee_cents ?? 0

  if (row.status === 'collected') {
    summary.collected += 1
    summary.payable += row.partner_payout_cents ?? 0
  }

  byPartner.set(slug, summary)
}

console.log('\nTrip Help partner payout summary\n')
console.log('Pay partners only for status = collected (service delivered on /scan).\n')

console.table(
  [...byPartner.values()]
    .sort((a, b) => b.payable - a.payable)
    .map((s) => ({
      partner: s.name,
      orders: s.orders,
      collected: s.collected,
      gross: aud(s.gross),
      partner_owes: aud(s.payable),
      platform_keeps: aud(s.platform),
    }))
)

const totalPayable = [...byPartner.values()].reduce((sum, s) => sum + s.payable, 0)
console.log(`\nTotal payable to partners (collected): ${aud(totalPayable)}\n`)

console.log('Recent orders:\n')
console.table(
  rows.slice(0, 20).map((row) => ({
    partner: row.partners?.name ?? '—',
    product: row.product_name,
    status: row.status,
    gross: aud(row.amount_aud_cents),
    partner_payout: aud(row.partner_payout_cents ?? 0),
    collected: row.collected_at ? row.collected_at.slice(0, 10) : '—',
  }))
)

console.log('Filter: node scripts/partner-order-payouts.mjs --partner le-shack --status collected')
