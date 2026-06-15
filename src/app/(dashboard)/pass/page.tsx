'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MembershipCard, PassPerkCategories, PinDisplay } from '@/components/pass'
import { cn } from '@/lib/utils/cn'

const FETCH_TIMEOUT_MS = 15_000

type PassPayload = {
  pin?: string
  pinExpiresIn?: number
  planName?: string
  userName?: string
  error?: string
}

async function fetchPassToken(): Promise<{ ok: boolean; status: number; data: PassPayload }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch('/api/pass/token', { signal: controller.signal, cache: 'no-store' })
    const data = await res.json() as PassPayload
    return { ok: res.ok, status: res.status, data }
  } finally {
    clearTimeout(timer)
  }
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PassPageHeader() {
  return (
    <header className="mb-6 flex items-center gap-3">
      <Link
        href="/dashboard"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-drift-border bg-drift-navy-light text-white transition-colors hover:border-drift-gold-to hover:text-drift-gold-mid"
        aria-label="Back to explore"
      >
        <BackIcon />
      </Link>
      <h1 className="text-xl font-bold tracking-tight">My Pass</h1>
    </header>
  )
}

function PassSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-40 rounded-xl bg-drift-navy-light" />
      <div className="rounded-4xl bg-drift-gold-gradient/40 p-8">
        <div className="mx-auto h-4 w-24 rounded bg-drift-navy-deep/20" />
        <div className="mx-auto mt-6 h-8 w-40 rounded bg-drift-navy-deep/20" />
        <div className="mx-auto mt-4 h-6 w-28 rounded bg-drift-navy-deep/15" />
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 w-11 rounded-2xl bg-drift-navy-deep/15" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-drift-navy-light" />
        ))}
      </div>
      <div className="h-16 rounded-2xl bg-drift-gold-gradient/30" />
    </div>
  )
}

export default function PassPage() {
  const [pin, setPin] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(60)

  const loadPass = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setError(null)

    try {
      const { ok, status, data } = await fetchPassToken()

      if (!ok) {
        if (status === 401) {
          window.location.assign('/login?next=/pass')
          return
        }
        if (status === 403) {
          setError('You need an active membership to view your pass.')
          return
        }
        setError(data.error ?? 'Could not load your pass. Try again.')
        return
      }

      if (data.pin) setPin(data.pin)
      if (data.userName) setUserName(data.userName)
      setSecondsLeft(Math.ceil((data.pinExpiresIn ?? 60_000) / 1000))
    } catch {
      setError('Request timed out. Check your connection and tap Retry.')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPass()
  }, [loadPass])

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          void loadPass(true)
          return 60
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [loadPass])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PassPageHeader />
        <PassSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <PassPageHeader />
        <div className="rounded-2xl border border-drift-border bg-drift-navy-light p-8 text-center">
          <p className="mb-6 text-sm text-drift-text-muted">{error}</p>
          {error.includes('active membership') ? (
            <Link
              href="/pricing"
              className="inline-flex rounded-2xl bg-drift-gold-gradient px-6 py-3 text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
            >
              Get membership
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                void loadPass()
              }}
              className="rounded-2xl bg-drift-gold-gradient px-6 py-3 text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PassPageHeader />

      <MembershipCard variant="full" memberName={userName || 'Member'}>
        <PinDisplay pin={pin} secondsLeft={secondsLeft} loading={refreshing} />
      </MembershipCard>

      <PassPerkCategories />

      <Link
        href="/dashboard"
        className={cn(
          'flex w-full flex-col items-center rounded-2xl bg-drift-gold-gradient px-6 py-4 text-center shadow-drift-card transition-all hover:brightness-105'
        )}
      >
        <span className="text-base font-bold text-drift-navy-deep">Browse Deals</span>
        <span className="mt-0.5 text-xs text-drift-navy-deep/75">
          Gyms · Coffee · Tours · Activities
        </span>
      </Link>
    </div>
  )
}
