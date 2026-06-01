'use client'

import { useState } from 'react'
import { PLANS } from '@/constants/plans'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function subscribe(planSlug: string) {
    setLoading(planSlug)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (res.status === 401) {
        // Not logged in — redirect to signup with plan intent
        window.location.href = `/signup?plan=${planSlug}`
        return
      }
      if (res.status === 409) {
        // Already subscribed — go to dashboard
        window.location.href = '/dashboard'
        return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Something went wrong')
        setLoading(null)
      }
    } catch {
      alert('Something went wrong')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Choose your pass</h1>
          <p className="text-[#6B7280]">Billed every 2 weeks. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.slug}
              className={`relative bg-[#1A1A1A] border rounded-2xl p-6 flex flex-col ${
                plan.is_popular ? 'border-[#00FF7F]' : 'border-[#2A2A2A]'
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00FF7F] text-[#0A0A0A] text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  A${(plan.price_aud_cents / 100).toFixed(0)}
                </span>
                <span className="text-[#6B7280] text-sm"> / 2 weeks</span>
              </div>

              <div className="text-[#00FF7F] font-semibold text-sm mb-4">
                {plan.credits_per_month} credits per period
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.slice(1).map((f) => (
                  <li key={f} className="text-sm text-[#9CA3AF] flex items-start gap-2">
                    <span className="text-[#00FF7F] mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => void subscribe(plan.slug)}
                disabled={loading === plan.slug}
                className={`w-full py-3 rounded-xl font-bold transition-colors disabled:opacity-50 ${
                  plan.is_popular
                    ? 'bg-[#00FF7F] text-[#0A0A0A] hover:bg-[#00E070]'
                    : 'border border-[#2A2A2A] text-white hover:border-[#00FF7F]'
                }`}
              >
                {loading === plan.slug ? 'Loading...' : 'Get started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
