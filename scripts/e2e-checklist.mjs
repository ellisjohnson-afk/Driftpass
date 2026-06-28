#!/usr/bin/env node
/**
 * E2E verification checklist — run after deployment.
 * Usage: node scripts/e2e-checklist.mjs [baseUrl]
 */
const baseArg = process.argv[2]
const fallbackPorts = [3000, 3001]

async function resolveBaseUrl() {
  if (baseArg) return baseArg.replace(/\/$/, '')

  for (const port of fallbackPorts) {
    const url = `http://localhost:${port}`
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      if (res.ok || res.status === 404) return url
    } catch {
      // try next port
    }
  }

  return `http://localhost:${fallbackPorts[0]}`
}

const base = await resolveBaseUrl()

const checks = [
  { name: 'Marketing landing', path: '/', expectStatus: 200 },
  { name: 'Signup page', path: '/signup', expectStatus: 200 },
  { name: 'Login page', path: '/login', expectStatus: 200 },
  { name: 'Forgot password', path: '/forgot-password', expectStatus: 200 },
  { name: 'Terms page', path: '/terms', expectStatus: 200 },
  { name: 'Partner scan (public)', path: '/scan', expectStatus: 200 },
  { name: 'Public partners API', path: '/api/partners/public', expectStatus: 200 },
]

console.log(`DriftPass E2E smoke test — ${base}\n`)

let passed = 0
for (const check of checks) {
  try {
    const res = await fetch(`${base}${check.path}`)
    const ok = res.status === check.expectStatus
    console.log(`${ok ? '✓' : '✗'} ${check.name} (${res.status})`)
    if (ok) passed++
  } catch (err) {
    console.log(`✗ ${check.name} — ${err instanceof Error ? err.message : 'failed'}`)
  }
}

console.log(`\n${passed}/${checks.length} smoke checks passed`)
console.log('\nManual flow (requires auth + Stripe):')
console.log('  1. Sign up at /signup → complete Stripe Checkout')
console.log('  2. Open /pass — verify 6-digit PIN rotates every 60s')
console.log('  3. Open /scan — enter member PIN from My Pass → Active member')
console.log('  4. Check /account — membership and profile load')

process.exit(passed === checks.length ? 0 : 1)
