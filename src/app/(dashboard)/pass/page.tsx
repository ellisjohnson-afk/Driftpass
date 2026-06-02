'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const FETCH_TIMEOUT_MS = 15_000

type PassPayload = {
  qrDataUrl?: string
  pin?: string
  pinExpiresIn?: number
  credits?: number
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

function PassSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6">
        <div className="flex justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-28 bg-[#2A2A2A] rounded" />
            <div className="h-3 w-20 bg-[#2A2A2A] rounded" />
          </div>
          <div className="h-10 w-12 bg-[#2A2A2A] rounded" />
        </div>
        <div className="bg-[#2A2A2A] rounded-2xl aspect-square mb-4" />
        <div className="h-20 bg-[#0A0A0A] rounded-2xl" />
      </div>
      <p className="text-center text-[#6B7280] text-sm mt-6">Loading your pass…</p>
    </div>
  )
}

export default function PassPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [pin, setPin] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [planName, setPlanName] = useState<string>('')
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
          setError('You need an active pass to view this page.')
          return
        }
        setError(data.error ?? 'Could not load your pass. Try again.')
        return
      }

      if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl)
      if (data.pin) setPin(data.pin)
      if (data.credits !== undefined) setCredits(data.credits)
      if (data.planName) setPlanName(data.planName)
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <PassSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 max-w-sm w-full">
          <p className="text-[#9CA3AF] mb-6">{error}</p>
          {error.includes('active pass') ? (
            <Link
              href="/pricing"
              className="inline-block bg-[#00FF7F] text-[#0A0A0A] px-6 py-3 rounded-lg font-bold"
            >
              Choose a plan
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                void loadPass()
              }}
              className="bg-[#00FF7F] text-[#0A0A0A] px-6 py-3 rounded-lg font-bold"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-4 animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-display text-xl font-bold">
              <span className="text-white">Drift</span>
              <span className="text-[#00FF7F]">Pass</span>
            </div>
            <div className="text-xs text-[#6B7280] mt-0.5">{planName}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#00FF7F]">{credits}</div>
            <div className="text-xs text-[#6B7280]">credits</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 flex items-center justify-center aspect-square relative">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="Your DriftPass QR Code"
              width={260}
              height={260}
              className="rounded-xl"
              priority
            />
          ) : (
            <div className="w-[260px] h-[260px] bg-[#F5F5F5] rounded-xl animate-pulse" />
          )}
          {refreshing && (
            <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#00FF7F] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="mt-4 bg-[#0A0A0A] rounded-2xl p-4 text-center">
          <div className="text-xs text-[#6B7280] uppercase tracking-widest mb-1">Partner PIN</div>
          <div className="text-4xl font-mono font-bold tracking-[0.3em] text-[#00FF7F]">
            {pin ? `${pin.slice(0, 3)} ${pin.slice(3)}` : '------'}
          </div>
          <div className="text-xs text-[#6B7280] mt-1">Refreshes in {secondsLeft}s</div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{userName}</div>
            <div className="text-xs text-[#6B7280]">DriftPass Member</div>
          </div>
          <div className="text-xs text-[#6B7280]">Show PIN to staff</div>
        </div>
      </div>

      <div className="mt-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 w-full max-w-sm">
        <h3 className="font-semibold text-sm mb-3">How to use your pass</h3>
        <ol className="space-y-2 text-sm text-[#9CA3AF]">
          <li className="flex gap-2">
            <span className="text-[#00FF7F] font-bold flex-shrink-0">1.</span>
            Tell staff your 6-digit PIN or show this QR code
          </li>
          <li className="flex gap-2">
            <span className="text-[#00FF7F] font-bold flex-shrink-0">2.</span>
            They enter it at the partner terminal
          </li>
          <li className="flex gap-2">
            <span className="text-[#00FF7F] font-bold flex-shrink-0">3.</span>
            Credits deduct automatically — you&apos;re in
          </li>
        </ol>
      </div>
    </div>
  )
}
