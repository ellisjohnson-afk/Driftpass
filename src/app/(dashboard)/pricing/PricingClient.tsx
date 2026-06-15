'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { HowItWorksSteps, MembershipPricingCard } from '@/components/pricing'
import { isLegacyPlanSlug } from '@/constants/plans'
import { buildPricingCheckoutPath } from '@/lib/auth/helpers'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getClientAppOrigin } from '@/lib/auth/app-origin'

type PricingClientProps = {
  /** Legacy ?plan= slug — auto-starts checkout without showing picker */
  initialPlan?: string | null
  backHref?: string
  isAuthenticated?: boolean
}

export default function PricingClient({
  initialPlan = null,
  backHref = '/dashboard',
  isAuthenticated = true,
}: PricingClientProps) {
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const autoStarted = useRef(false)

  const checkoutSlug = initialPlan && isLegacyPlanSlug(initialPlan) ? initialPlan : 'membership'

  function startMembership() {
    if (!isAuthenticated) {
      window.location.href = appUrlAt(getClientAppOrigin(), '/login', {
        next: buildPricingCheckoutPath(checkoutSlug),
        plan: checkoutSlug,
      })
      return
    }
    void subscribe(checkoutSlug)
  }

  async function subscribe(planSlug: string) {
    setLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug }),
      })
      const data = await res.json() as { url?: string; error?: string }

      if (res.status === 401) {
        window.location.href = appUrlAt(getClientAppOrigin(), '/login', {
          next: buildPricingCheckoutPath(planSlug),
          plan: planSlug,
        })
        return
      }
      if (res.status === 409) {
        window.location.href = appUrlAt(getClientAppOrigin(), '/account')
        return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        const message =
          data.error === 'Plan not configured in database'
            ? 'Membership plan could not be loaded. Run npm run db:apply-006, restart the dev server, and retry.'
            : (data.error ?? 'Something went wrong')
        setCheckoutError(message)
        setLoading(false)
      }
    } catch {
      setCheckoutError('Something went wrong. Check the terminal and try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialPlan && isLegacyPlanSlug(initialPlan) && isAuthenticated && !autoStarted.current) {
      autoStarted.current = true
      void subscribe(initialPlan)
    }
  }, [initialPlan, isAuthenticated])

  return (
    <div className="animate-fade-in space-y-8 pb-4">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-drift-border bg-drift-navy-light text-drift-text-muted transition-colors hover:text-white"
          aria-label="Go back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-drift-text-muted">
            Drift Pass
          </p>
          <h1 className="text-2xl font-bold">Membership</h1>
        </div>
      </div>

      <HowItWorksSteps />

      {checkoutError && (
        <div className="rounded-xl border border-red-800/50 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {checkoutError}
        </div>
      )}

      <MembershipPricingCard
        loading={loading}
        onStart={startMembership}
      />
    </div>
  )
}
