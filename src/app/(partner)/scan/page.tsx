'use client'

import { useState, useEffect } from 'react'

interface Partner {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
  credit_cost: number
}

interface RedemptionResult {
  success: boolean
  memberName?: string
  serviceName?: string
  creditsUsed?: number
  creditsRemaining?: number
  error?: string
}

const FETCH_TIMEOUT_MS = 12_000

async function fetchJson<T>(url: string): Promise<{ ok: boolean; data: T }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    const data = await res.json() as T
    return { ok: res.ok, data }
  } finally {
    clearTimeout(timer)
  }
}

export default function ScanPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [partnerId, setPartnerId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [pin, setPin] = useState('')
  const [loadingPartners, setLoadingPartners] = useState(true)
  const [loadingServices, setLoadingServices] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<RedemptionResult | null>(null)

  useEffect(() => {
    setLoadingPartners(true)
    setLoadError(null)
    void fetchJson<Partner[]>('/api/partners/public')
      .then(({ ok, data }) => {
        if (!ok || !Array.isArray(data)) {
          setLoadError('Could not load partners. Refresh the page.')
          return
        }
        setPartners(data)
        if (data[0]) setPartnerId(data[0].id)
      })
      .catch(() => setLoadError('Network error loading partners.'))
      .finally(() => setLoadingPartners(false))
  }, [])

  useEffect(() => {
    if (!partnerId) return
    setLoadingServices(true)
    setServices([])
    setServiceId('')
    void fetchJson<{ services?: Service[] }>(`/api/partners/public?partnerId=${partnerId}`)
      .then(({ ok, data }) => {
        const list = ok ? (data.services ?? []) : []
        setServices(list)
        if (list[0]) setServiceId(list[0].id)
      })
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false))
  }, [partnerId])

  async function process() {
    const cleanPin = pin.replace(/\s/g, '')
    if (cleanPin.length !== 6) return
    if (!serviceId) return

    setProcessing(true)
    setResult(null)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin, serviceId }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json() as RedemptionResult & { error?: string }
      if (res.ok) {
        setResult({ ...data, success: true })
        setPin('')
      } else {
        setResult({ success: false, error: data.error ?? 'Declined' })
      }
    } catch {
      setResult({ success: false, error: 'Network error — try again' })
    } finally {
      setProcessing(false)
    }
  }

  const formDisabled = loadingPartners || loadingServices || processing

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-2xl font-bold mb-1">
            <span className="text-white">Drift</span>
            <span className="text-[#00FF7F]">Pass</span>
          </div>
          <p className="text-sm text-[#6B7280]">Partner Terminal</p>
        </div>

        {loadError && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-xl px-4 py-3 text-sm text-center">
            {loadError}
          </div>
        )}

        {!result ? (
          <>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
              {loadingPartners ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 bg-[#2A2A2A] rounded-lg" />
                  <div className="h-10 bg-[#2A2A2A] rounded-lg" />
                </div>
              ) : partners.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-4">No partners available yet.</p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Your business</label>
                    <select
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value)}
                      disabled={formDisabled}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FF7F] disabled:opacity-60"
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Service</label>
                    <select
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      disabled={formDisabled || services.length === 0}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FF7F] disabled:opacity-60"
                    >
                      {loadingServices && <option value="">Loading services…</option>}
                      {!loadingServices && services.length === 0 && (
                        <option value="">No services for this partner</option>
                      )}
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} — {s.credit_cost} credits</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
              <label className="block text-xs text-[#9CA3AF] mb-3 uppercase tracking-wide">Member PIN</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={7}
                placeholder="000 000"
                value={pin}
                disabled={formDisabled || partners.length === 0}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setPin(digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits)
                }}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-4 text-white text-3xl font-mono tracking-[0.3em] text-center focus:outline-none focus:border-[#00FF7F] placeholder-[#3A3A3A] disabled:opacity-60"
              />
              <p className="text-xs text-[#6B7280] mt-2 text-center">Ask the member to show their PIN</p>
            </div>

            <button
              type="button"
              onClick={() => void process()}
              disabled={formDisabled || pin.replace(/\s/g, '').length !== 6 || !serviceId}
              className="w-full bg-[#00FF7F] text-[#0A0A0A] py-4 rounded-xl font-bold text-lg hover:bg-[#00E070] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing && (
                <span className="w-5 h-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
              )}
              {processing ? 'Processing…' : 'Accept Pass ✓'}
            </button>
          </>
        ) : (
          <div className={`rounded-2xl p-8 text-center border-2 ${result.success ? 'bg-[#00FF7F]/10 border-[#00FF7F]' : 'bg-red-900/20 border-red-700'}`}>
            <div className="text-6xl mb-4">{result.success ? '✅' : '❌'}</div>
            {result.success ? (
              <>
                <h2 className="text-2xl font-bold text-[#00FF7F] mb-1">Approved!</h2>
                {result.memberName && <p className="text-white font-medium mb-1">{result.memberName}</p>}
                <p className="text-sm text-[#9CA3AF] mb-5">{result.serviceName}</p>
                <div className="bg-[#0A0A0A] rounded-xl p-4 space-y-3 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Credits used</span>
                    <span className="text-white font-bold">−{result.creditsUsed}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#2A2A2A] pt-3">
                    <span className="text-[#6B7280]">Member balance</span>
                    <span className="text-[#00FF7F] font-bold">{result.creditsRemaining} left</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-red-400 mb-2">Declined</h2>
                <p className="text-[#9CA3AF] mb-6">{result.error}</p>
              </>
            )}
            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full border border-[#2A2A2A] text-white py-3 rounded-xl font-semibold hover:border-[#00FF7F] transition-colors"
            >
              Next member →
            </button>
          </div>
        )}

        <p className="text-center text-xs text-[#3A3A3A]">DriftPass Partner Terminal · Bookmark this page</p>
      </div>
    </div>
  )
}
