#!/usr/bin/env node
/**
 * Apply migration 008 — partner opening_hours + timezone columns.
 * Run the SQL file in Supabase SQL editor, then this script verifies seed data.
 *
 * Run: npm run db:apply-008
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

if (!baseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
}

console.log('Checking partners.opening_hours…')
console.log('If this fails, run supabase/migrations/008_partner_opening_hours.sql in the SQL editor first.\n')

const listRes = await fetch(
  `${baseUrl}/rest/v1/partners?select=slug,name,timezone,opening_hours&order=slug`,
  { headers }
)

if (!listRes.ok) {
  const body = await listRes.text()
  console.error('✗ Query failed:', listRes.status, body)
  console.error('\nRun supabase/migrations/008_partner_opening_hours.sql in Supabase SQL editor.')
  process.exit(1)
}

const partners = await listRes.json()
const withHours = partners.filter((p) => p.opening_hours?.rows?.length)

console.log(`✓ ${withHours.length}/${partners.length} partners have opening hours in DB`)
console.table(
  partners.map((p) => ({
    slug: p.slug,
    timezone: p.timezone,
    hours: p.opening_hours?.rows?.[0]?.hours ?? '(missing — run migration SQL)',
  }))
)

if (withHours.length < partners.length) {
  console.log('\n→ Apply supabase/migrations/008_partner_opening_hours.sql in Supabase SQL editor.')
  process.exit(1)
}
