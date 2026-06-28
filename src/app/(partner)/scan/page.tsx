'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

type TerminalMode = 'member' | 'collect'

interface MemberVerifyResult {
  success: boolean
  memberName?: string
  planName?: string
  error?: string
}

interface CollectResult {
  success: boolean
  productName?: string
  memberName?: string
  amountAudCents?: number
  partnerName?: string
  error?: string
}

const FETCH_TIMEOUT_MS = 12_000

function formatPinInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 6)
  return digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('h-8 w-8', className)} aria-hidden>
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('h-8 w-8', className)} aria-hidden>
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

function PinForm({
  id,
  label,
  hint,
  pin,
  setPin,
  processing,
  canSubmit,
  submitLabel,
  processingLabel,
  onSubmit,
}: {
  id: string
  label: string
  hint: string
  pin: string
  setPin: (value: string) => void
  processing: boolean
  canSubmit: boolean
  submitLabel: string
  processingLabel: string
  onSubmit: () => void
}) {
  return (
    <>
      <div className="rounded-3xl border border-drift-border/60 bg-drift-navy-light p-5 shadow-drift-card">
        <label
          htmlFor={id}
          className="mb-3 block text-xs font-semibold uppercase tracking-[0.15em] text-drift-text-muted"
        >
          {label}
        </label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          placeholder="000 000"
          value={pin}
          disabled={processing}
          onChange={(e) => setPin(formatPinInput(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) onSubmit()
          }}
          className="w-full rounded-2xl border border-drift-border bg-drift-navy-deep px-4 py-4 text-center font-mono text-3xl tracking-[0.25em] text-white placeholder:text-drift-text-subtle focus:border-drift-gold-to/50 focus:outline-none disabled:opacity-60"
        />
        <p className="mt-3 text-center text-xs text-drift-text-muted">{hint}</p>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-drift-gold-gradient py-4 text-base font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {processing && (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-drift-navy-deep border-t-transparent" />
        )}
        {processing ? processingLabel : submitLabel}
      </button>
    </>
  )
}

export default function ScanPage() {
  const [mode, setMode] = useState<TerminalMode>('collect')
  const [pin, setPin] = useState('')
  const [processing, setProcessing] = useState(false)
  const [memberResult, setMemberResult] = useState<MemberVerifyResult | null>(null)
  const [collectResult, setCollectResult] = useState<CollectResult | null>(null)

  const cleanPin = pin.replace(/\s/g, '')
  const canSubmit = cleanPin.length === 6 && !processing
  const result = mode === 'member' ? memberResult : collectResult

  function reset() {
    setPin('')
    setMemberResult(null)
    setCollectResult(null)
  }

  function switchMode(next: TerminalMode) {
    setMode(next)
    reset()
  }

  async function verifyMember() {
    if (!canSubmit) return
    setProcessing(true)
    setMemberResult(null)

    try {
      const res = await fetch('/api/partners/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      const data = (await res.json()) as MemberVerifyResult & { error?: string }

      if (res.ok) {
        setMemberResult({ success: true, memberName: data.memberName, planName: data.planName })
        setPin('')
      } else {
        setMemberResult({ success: false, error: data.error ?? 'Could not verify this PIN' })
      }
    } catch {
      setMemberResult({ success: false, error: 'Network error — try again' })
    } finally {
      setProcessing(false)
    }
  }

  async function collectOrder() {
    if (!canSubmit) return
    setProcessing(true)
    setCollectResult(null)

    try {
      const res = await fetch('/api/partners/collect-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      const data = (await res.json()) as CollectResult & { error?: string }

      if (res.ok) {
        setCollectResult({
          success: true,
          productName: data.productName,
          memberName: data.memberName,
          amountAudCents: data.amountAudCents,
          partnerName: data.partnerName,
        })
        setPin('')
      } else {
        setCollectResult({ success: false, error: data.error ?? 'Could not collect this order' })
      }
    } catch {
      setCollectResult({ success: false, error: 'Network error — try again' })
    } finally {
      setProcessing(false)
    }
  }

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
        </header>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-drift-border/60 bg-drift-navy-light p-1">
          <button
            type="button"
            onClick={() => switchMode('collect')}
            className={cn(
              'rounded-xl py-2.5 text-xs font-bold uppercase tracking-wide transition-colors',
              mode === 'collect'
                ? 'bg-drift-gold-gradient text-drift-navy-deep'
                : 'text-drift-text-muted hover:text-white'
            )}
          >
            Collect order
          </button>
          <button
            type="button"
            onClick={() => switchMode('member')}
            className={cn(
              'rounded-xl py-2.5 text-xs font-bold uppercase tracking-wide transition-colors',
              mode === 'member'
                ? 'bg-drift-gold-gradient text-drift-navy-deep'
                : 'text-drift-text-muted hover:text-white'
            )}
          >
            Verify member
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-white">
            {mode === 'collect' ? 'Collection PIN' : 'Membership PIN'}
          </h1>
          <p className="mt-2 text-sm text-drift-text-muted">
            {mode === 'collect'
              ? 'Enter the PIN from the traveller’s purchase receipt.'
              : 'Enter the rotating code from the traveller’s My Pass screen.'}
          </p>
        </div>

        {!result ? (
          <PinForm
            id={mode === 'collect' ? 'collection-pin' : 'member-pin'}
            label={mode === 'collect' ? 'Collection PIN' : 'Member PIN'}
            hint={
              mode === 'collect'
                ? 'Single-use PIN from a paid Trip Help or marketplace order'
                : 'Refreshes every 60 seconds on the member’s phone'
            }
            pin={pin}
            setPin={setPin}
            processing={processing}
            canSubmit={canSubmit}
            submitLabel={mode === 'collect' ? 'Confirm collected' : 'Verify member'}
            processingLabel={mode === 'collect' ? 'Confirming…' : 'Verifying…'}
            onSubmit={() => void (mode === 'collect' ? collectOrder() : verifyMember())}
          />
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

            {result.success && mode === 'collect' && collectResult ? (
              <>
                <h2 className="text-2xl font-bold text-drift-gold-mid">Collected</h2>
                <p className="mt-2 text-lg font-semibold text-white">{collectResult.productName}</p>
                {collectResult.memberName ? (
                  <p className="mt-1 text-sm text-drift-text-muted">{collectResult.memberName}</p>
                ) : null}
                {collectResult.amountAudCents != null ? (
                  <p className="mt-3 text-sm text-drift-text-muted">
                    Paid ${(collectResult.amountAudCents / 100).toFixed(2)}
                    {collectResult.partnerName ? ` · ${collectResult.partnerName}` : ''}
                  </p>
                ) : null}
              </>
            ) : null}

            {result.success && mode === 'member' && memberResult ? (
              <>
                <h2 className="text-2xl font-bold text-drift-gold-mid">Active member</h2>
                {memberResult.memberName ? (
                  <p className="mt-2 text-lg font-semibold text-white">{memberResult.memberName}</p>
                ) : null}
                {memberResult.planName ? (
                  <p className="mt-1 text-sm text-drift-text-muted">{memberResult.planName}</p>
                ) : null}
                <p className="mt-5 rounded-2xl border border-drift-gold-to/30 bg-drift-navy-deep/60 px-4 py-3 text-sm text-drift-text-muted">
                  Apply member perks or discounts as agreed.
                </p>
              </>
            ) : null}

            {!result.success ? (
              <>
                <h2 className="text-2xl font-bold text-red-400">Not accepted</h2>
                <p className="mt-3 text-sm text-drift-text-muted">{result.error}</p>
              </>
            ) : null}

            <button
              type="button"
              onClick={reset}
              className="mt-6 w-full rounded-2xl border border-drift-border py-3 text-sm font-semibold text-white transition-colors hover:border-drift-gold-to/40 hover:text-drift-gold-mid"
            >
              Next customer →
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
