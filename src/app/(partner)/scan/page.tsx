'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface VerifyResult {
  success: boolean
  memberName?: string
  planName?: string
  error?: string
}

const FETCH_TIMEOUT_MS = 12_000

function formatPinInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 6)
  return digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={cn('h-8 w-8', className)}
      aria-hidden
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={cn('h-8 w-8', className)}
      aria-hidden
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

export default function ScanPage() {
  const [pin, setPin] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)

  async function verifyPin() {
    const cleanPin = pin.replace(/\s/g, '')
    if (cleanPin.length !== 6) return

    setProcessing(true)
    setResult(null)

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      const res = await fetch('/api/partners/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      const data = (await res.json()) as VerifyResult & { error?: string }

      if (res.ok) {
        setResult({
          success: true,
          memberName: data.memberName,
          planName: data.planName,
        })
        setPin('')
      } else {
        setResult({
          success: false,
          error: data.error ?? 'Could not verify this PIN',
        })
      }
    } catch {
      setResult({ success: false, error: 'Network error — try again' })
    } finally {
      setProcessing(false)
    }
  }

  const cleanPin = pin.replace(/\s/g, '')
  const canSubmit = cleanPin.length === 6 && !processing

  return (
    <div className="flex min-h-screen flex-col items-center bg-drift-navy-deep px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <p className="text-2xl font-bold tracking-tight">
            <span className="text-white">Drift</span>
            <span className="text-drift-gold-mid">Pass</span>
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
            Partner terminal
          </p>
          <h1 className="mt-4 text-xl font-bold text-white">Verify member</h1>
          <p className="mt-2 text-sm text-drift-text-muted">
            Ask the traveller to open <span className="text-white">My Pass</span> and enter their
            6-digit code below.
          </p>
        </header>

        {!result ? (
          <>
            <div className="rounded-3xl border border-drift-border/60 bg-drift-navy-light p-5 shadow-drift-card">
              <label
                htmlFor="member-pin"
                className="mb-3 block text-xs font-semibold uppercase tracking-[0.15em] text-drift-text-muted"
              >
                Member PIN
              </label>
              <input
                id="member-pin"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                placeholder="000 000"
                value={pin}
                disabled={processing}
                onChange={(e) => setPin(formatPinInput(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit) void verifyPin()
                }}
                className="w-full rounded-2xl border border-drift-border bg-drift-navy-deep px-4 py-4 text-center font-mono text-3xl tracking-[0.25em] text-white placeholder:text-drift-text-subtle focus:border-drift-gold-to/50 focus:outline-none disabled:opacity-60"
              />
              <p className="mt-3 text-center text-xs text-drift-text-muted">
                PIN refreshes every 60 seconds on the member&apos;s phone
              </p>
            </div>

            <button
              type="button"
              onClick={() => void verifyPin()}
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-drift-gold-gradient py-4 text-base font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {processing && (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-drift-navy-deep border-t-transparent" />
              )}
              {processing ? 'Verifying…' : 'Verify member'}
            </button>
          </>
        ) : (
          <div
            className={cn(
              'rounded-3xl border p-8 text-center shadow-drift-card',
              result.success
                ? 'border-drift-gold-to/40 bg-drift-gold-gradient/10'
                : 'border-red-800/60 bg-red-900/20'
            )}
          >
            <div
              className={cn(
                'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full',
                result.success ? 'bg-drift-gold-gradient/20 text-drift-gold-mid' : 'bg-red-900/40 text-red-400'
              )}
            >
              {result.success ? <CheckIcon /> : <XIcon />}
            </div>

            {result.success ? (
              <>
                <h2 className="text-2xl font-bold text-drift-gold-mid">Active member</h2>
                {result.memberName ? (
                  <p className="mt-2 text-lg font-semibold text-white">{result.memberName}</p>
                ) : null}
                {result.planName ? (
                  <p className="mt-1 text-sm text-drift-text-muted">{result.planName}</p>
                ) : null}
                <p className="mt-5 rounded-2xl border border-drift-gold-to/30 bg-drift-navy-deep/60 px-4 py-3 text-sm text-drift-text-muted">
                  Apply member perks or discounts as agreed. Paid add-ons use a separate collection
                  PIN (coming soon).
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-red-400">Not verified</h2>
                <p className="mt-3 text-sm text-drift-text-muted">{result.error}</p>
              </>
            )}

            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-6 w-full rounded-2xl border border-drift-border py-3 text-sm font-semibold text-white transition-colors hover:border-drift-gold-to/40 hover:text-drift-gold-mid"
            >
              Next member →
            </button>
          </div>
        )}

        <p className="text-center text-xs text-drift-text-subtle">
          Bookmark this page on your counter tablet · driftpass.com.au/scan
        </p>
      </div>
    </div>
  )
}
