#!/usr/bin/env node
/**
 * Generate a Supabase auth link without sending email (local dev only).
 *
 * Usage:
 *   node scripts/generate-auth-link.mjs ellisdtravels@gmail.com recovery
 *   node scripts/generate-auth-link.mjs ellisdtravels@gmail.com magiclink
 *
 * Optional env in .env.local:
 *   AUTH_LINK_REDIRECT_TO=http://localhost:3004/callback?next=%2Freset-password
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
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
  }
  return env
}

const email = process.argv[2]
const type = process.argv[3] ?? 'recovery'

if (!email) {
  console.error('Usage: node scripts/generate-auth-link.mjs <email> [recovery|magiclink]')
  process.exit(1)
}

if (type !== 'recovery' && type !== 'magiclink') {
  console.error('Type must be recovery or magiclink')
  process.exit(1)
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const redirectTo =
  env.AUTH_LINK_REDIRECT_TO ??
  'http://localhost:3004/callback?next=%2Freset-password'

const res = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type,
    email,
    redirect_to: redirectTo,
  }),
})

const body = await res.json()

if (!res.ok) {
  console.error('Failed:', body.error_description ?? body.msg ?? body.message ?? res.statusText)
  process.exit(1)
}

const actionLink = body.action_link ?? body.properties?.action_link

if (!actionLink) {
  console.error('No action_link in response:', body)
  process.exit(1)
}

console.log('\nOpen this link in your browser (dev only — do not share):\n')
console.log(actionLink)
console.log('\nRedirect after auth:', redirectTo)
console.log('')
