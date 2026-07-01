'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  HowItWorksSteps,
  MembershipPricingCard,
  SponsorLogosSection,
} from '@/components/pricing'
import { isLegacyPlanSlug } from '@/constants/plans'
import { buildPricingCheckoutPath } from '@/lib/auth/helpers'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getClientAppOrigin } from '@/lib/auth/app-origin'
import type { TownSponsor } from '@/lib/towns/constants'

type PricingClientProps = {
  /** Legacy ?plan= slug — auto-starts checkout without showing picker */
  initialPlan?: string | null
  backHref?: string
  isAuthenticated?: boolean
  sponsors?: TownSponsor[]
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PricingClient({
  initialPlan = null,
  backHref = '/',
  isAuthenticated = true,
  sponsors = [],
}: PricingClientProps) {
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const autoStarted = useRef(false)

  const checkoutSlug = initialPlan && isLegacyPlanSlug(initialPlan) ? initialPlan : 'membership'

  function startMembership() {
    if (!isAuthenticated) {
      window.location.href = appUrlAt(getClientAppOrigin(), '/signup', {
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
    <div className="animate-fade-in -mx-4 -mt-6 pb-4">
      <div className="bg-drift-navy-deep px-5 pb-8 pt-5">
        <Link
          href={backHref}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Go back"
        >
          <BackIcon />
        </Link>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
          Drift Pass
        </p>
        <h1 className="mt-2 text-3xl font-bold">Membership</h1>
      </div>

      <div className="relative space-y-8 px-5 pb-6 pt-6">
        <HowItWorksSteps />

        {checkoutError ? (
          <div className="rounded-xl border border-red-800/50 bg-red-900/30 px-4 py-3 text-sm text-red-400">
            {checkoutError}
          </div>
        ) : null}

        <MembershipPricingCard loading={loading} onStart={startMembership} />

        <SponsorLogosSection sponsors={sponsors} />

        {!isAuthenticated ? (
          <p className="text-center text-sm text-drift-text-muted">
            Already a member?{' '}
            <Link
              href={appUrlAt(getClientAppOrigin(), '/login', {
                next: buildPricingCheckoutPath('membership'),
                plan: 'membership',
              })}
              className="font-semibold text-drift-gold-mid hover:text-white"
            >
              Sign in
            </Link>
          </p>
        ) : null}

        <p className="text-center text-[11px] leading-relaxed text-drift-text-subtle">
          Free membership — pay only for Trip Help add-ons and experiences. By joining you agree to our{' '}
          <Link href="/terms" className="underline hover:text-drift-text-muted">
            terms
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
