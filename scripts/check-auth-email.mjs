#!/usr/bin/env node
/**
 * Check whether a signup confirmation email was sent / user is confirmed.
 * Usage: node scripts/check-auth-email.mjs ellisdtravels+test@gmail.com
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

const targetEmail = process.argv[2]?.toLowerCase()

if (!targetEmail) {
  console.error('Usage: node scripts/check-auth-email.mjs <email>')
  process.exit(1)
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const resendKey = env.RESEND_API_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

async function findUserByEmail(email) {
  let page = 1
  while (page <= 10) {
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
      }
    )
    if (!res.ok) {
      throw new Error(`Supabase admin users failed: ${res.status}`)
    }
    const body = await res.json()
    const users = body.users ?? []
    const match = users.find((u) => u.email?.toLowerCase() === email)
    if (match) return match
    if (users.length < 100) break
    page += 1
  }
  return null
}

const user = await findUserByEmail(targetEmail)

console.log(`\nAuth check for: ${targetEmail}\n`)

if (!user) {
  console.log('✗ No Supabase auth user found with this email.')
  process.exit(1)
}

const confirmed = Boolean(user.email_confirmed_at)
const confirmationSent = Boolean(user.confirmation_sent_at)

console.log('User status:')
console.table({
  email: user.email,
  created_at: user.created_at,
  email_confirmed_at: user.email_confirmed_at ?? '(not confirmed)',
  confirmation_sent_at: user.confirmation_sent_at ?? '(never sent)',
  last_sign_in_at: user.last_sign_in_at ?? '(never)',
  provider: user.app_metadata?.provider ?? user.app_metadata?.providers?.join(', ') ?? 'email',
})

if (confirmed && !confirmationSent) {
  console.log(
    '\n→ Email is confirmed but confirmation_sent_at is empty.\n' +
      '  Likely cause: "Confirm email" is OFF in Supabase, so signup returns a session immediately\n' +
      '  and no confirmation email is required or sent.'
  )
} else if (!confirmed && confirmationSent) {
  console.log(
    '\n→ Confirmation email was sent but email is not confirmed yet.\n' +
      '  Check spam / Promotions in Gmail. Also search for mail from hello@driftpass.com.au.'
  )
} else if (!confirmed && !confirmationSent) {
  console.log(
    '\n→ User exists but no confirmation email was recorded as sent.\n' +
      '  Check Supabase Auth → Logs and SMTP settings (smtp.resend.com).'
  )
} else {
  console.log('\n→ User is confirmed and a confirmation email was sent.')
}

if (resendKey) {
  const resendRes = await fetch('https://api.resend.com/emails?limit=50', {
    headers: { Authorization: `Bearer ${resendKey}` },
  })

  if (resendRes.ok) {
    const { data = [] } = await resendRes.json()
    const matches = data.filter((e) =>
      JSON.stringify(e.to ?? []).toLowerCase().includes(targetEmail.split('@')[0])
    )

    console.log(`\nResend deliveries mentioning "${targetEmail.split('@')[0]}" (${matches.length}):`)
    if (matches.length === 0) {
      console.log('  (none — auth email may not have gone through Resend / SMTP)')
    } else {
      console.table(
        matches.map((e) => ({
          to: Array.isArray(e.to) ? e.to.join(', ') : e.to,
          subject: e.subject,
          created_at: e.created_at,
          last_event: e.last_event,
        }))
      )
    }
  } else {
    console.log('\nCould not list Resend emails (API returned', resendRes.status + ')')
  }
}

console.log('\nDashboard links:')
console.log('  Supabase Auth logs: https://supabase.com/dashboard/project/kxutuhifihgogrervsve/auth/logs')
console.log('  Resend activity:    https://resend.com/emails')
console.log('')
