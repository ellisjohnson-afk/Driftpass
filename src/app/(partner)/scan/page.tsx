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

export default function ScanPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [partnerId, setPartnerId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RedemptionResult | null>(null)

  useEffect(() => {
    void fetch('/api/partners/public')
      .then((r) => r.json())
      .then((data) => {
        const list = data as Partner[]
        setPartners(list)
        if (list.length > 0 && list[0]) setPartnerId(list[0].id)
      })
  }, [])

  useEffect(() => {
    if (!partnerId) return
    setServices([])
    setServiceId('')
    void fetch(`/api/partners/public?partnerId=${partnerId}`)
      .then((r) => r.json())
      .then((data) => {
        const list = (data as { services?: Service[] }).services ?? []
        setServices(list)
        if (list.length > 0 && list[0]) setServiceId(list[0].id)
      })
  }, [partnerId])

  async function process() {
    const cleanPin = pin.replace(/\s/g, '')
    if (cleanPin.length !== 6) { alert('Enter the full 6-digit PIN'); return }
    if (!serviceId) { alert('Select a service'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin, serviceId }),
      })
      const data = await res.json() as RedemptionResult & { error?: string }
      if (res.ok) {
        setResult({ success: true, ...data })
        setPin('')
      } else {
        setResult({ success: false, error: data.error ?? 'Declined' })
      }
    } catch {
      setResult({ success: false, error: 'Network error — try again' })
    } finally {
      setLoading(false)
    }
  }

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

        {!result ? (
          <>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Your business</label>
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FF7F]"
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
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FF7F]"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.credit_cost} credits</option>
                  ))}
                  {services.length === 0 && <option disabled>Loading...</option>}
                </select>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
              <label className="block text-xs text-[#9CA3AF] mb-3 uppercase tracking-wide">Member PIN</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={7}
                placeholder="000 000"
                value={pin}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setPin(digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits)
                }}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-4 text-white text-3xl font-mono tracking-[0.3em] text-center focus:outline-none focus:border-[#00FF7F] placeholder-[#3A3A3A]"
              />
              <p className="text-xs text-[#6B7280] mt-2 text-center">Ask the member to show their PIN</p>
            </div>

            <button
              onClick={() => void process()}
              disabled={loading || pin.replace(/\s/g, '').length !== 6}
              className="w-full bg-[#00FF7F] text-[#0A0A0A] py-4 rounded-xl font-bold text-lg hover:bg-[#00E070] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Accept Pass ✓'}
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
