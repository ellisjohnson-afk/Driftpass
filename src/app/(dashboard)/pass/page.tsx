'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

// The QR pass page — subscriber's digital pass
// QR token refreshes every 25 seconds (5s before expiry)
export default function PassPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [pin, setPin] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [planName, setPlanName] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(30)

  const fetchPass = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/pass/token')
      const data = await res.json() as {
        qrDataUrl?: string
        pin?: string
        pinExpiresIn?: number
        credits?: number
        planName?: string
        userName?: string
      }
      if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl)
      if (data.pin) setPin(data.pin)
      if (data.credits !== undefined) setCredits(data.credits)
      if (data.planName) setPlanName(data.planName)
      if (data.userName) setUserName(data.userName)
      // Sync countdown to actual PIN expiry
      const expiresIn = data.pinExpiresIn ?? 30_000
      setSecondsLeft(Math.ceil(expiresIn / 1000))
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPass()
  }, [fetchPass])

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          void fetchPass()
          return 25
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [fetchPass])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-2 border-[#00FF7F] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#6B7280] text-sm">Loading your pass...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-4 animate-fade-in">
      {/* Pass card */}
      <div className="w-full max-w-sm bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-3xl p-6 shadow-2xl">
        {/* Header */}
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

        {/* QR Code */}
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

        {/* PIN — primary method for partners */}
        <div className="mt-4 bg-[#0A0A0A] rounded-2xl p-4 text-center">
          <div className="text-xs text-[#6B7280] uppercase tracking-widest mb-1">Partner PIN</div>
          <div className="text-4xl font-mono font-bold tracking-[0.3em] text-[#00FF7F]">
            {pin ? `${pin.slice(0, 3)} ${pin.slice(3)}` : '------'}
          </div>
          <div className="text-xs text-[#6B7280] mt-1">Refreshes in {secondsLeft}s</div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{userName}</div>
            <div className="text-xs text-[#6B7280]">DriftPass Member</div>
          </div>
          <div className="text-xs text-[#6B7280]">Show PIN to staff</div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 w-full max-w-sm">
        <h3 className="font-semibold text-sm mb-3">How to use your pass</h3>
        <ol className="space-y-2 text-sm text-[#9CA3AF]">
          <li className="flex gap-2">
            <span className="text-[#00FF7F] font-bold flex-shrink-0">1.</span>
            Show this screen to the partner staff
          </li>
          <li className="flex gap-2">
            <span className="text-[#00FF7F] font-bold flex-shrink-0">2.</span>
            They scan your QR code with their phone
          </li>
          <li className="flex gap-2">
            <span className="text-[#00FF7F] font-bold flex-shrink-0">3.</span>
            Credits deduct automatically — you&apos;re in
          </li>
        </ol>
      </div>

      <p className="mt-4 text-xs text-[#6B7280] text-center">
        QR code refreshes every 30 seconds for security
      </p>
    </div>
  )
}
