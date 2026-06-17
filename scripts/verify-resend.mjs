#!/usr/bin/env node
/**
 * Verify Resend is configured for auth + transactional email.
 * Auth emails still require Supabase SMTP setup — see scripts/supabase-auth-email-setup.md
 *
 * Run: npm run email:verify
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

const env = loadEnv()
const apiKey = env.RESEND_API_KEY
const fromEmail = env.RESEND_FROM_EMAIL ?? 'hello@driftpass.com.au'
const fromName = env.RESEND_FROM_NAME ?? 'DriftPass'

if (!apiKey) {
  console.error('✗ Missing RESEND_API_KEY in .env.local')
  console.error('→ Get a key at https://resend.com/api-keys')
  process.exit(1)
}

console.log('Checking Resend API key…')

const domainsRes = await fetch('https://api.resend.com/domains', {
  headers: { Authorization: `Bearer ${apiKey}` },
})

if (!domainsRes.ok) {
  const body = await domainsRes.text()
  console.error('✗ Resend API check failed:', domainsRes.status, body)
  process.exit(1)
}

const domains = await domainsRes.json()
const list = domains.data ?? []

console.log('✓ Resend API key valid')
console.log(`  From: ${fromName} <${fromEmail}>`)

if (list.length === 0) {
  console.log('\n⚠ No domains in Resend yet.')
  console.log('→ Add driftpass.com.au at https://resend.com/domains before Supabase SMTP will work.')
} else {
  console.log('\nDomains:')
  console.table(
    list.map((d) => ({
      name: d.name,
      status: d.status,
      region: d.region,
    }))
  )

  const verified = list.filter((d) => d.status === 'verified')
  if (verified.length === 0) {
    console.log('\n⚠ No verified domains — auth emails will fail until DNS is verified.')
  } else {
    console.log(`\n✓ ${verified.length} verified domain(s) ready for SMTP`)
  }
}

console.log('\nNext: configure Supabase SMTP → scripts/supabase-auth-email-setup.md')
