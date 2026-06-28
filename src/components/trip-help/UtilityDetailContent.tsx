import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { NoProviderEmptyState } from '@/components/ui'
import { ProductPurchaseButton } from '@/components/orders'
import type { TripUtility } from '@/lib/trip-help/constants'
import { TripUtilityIcon } from './UtilityTile'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-drift-gold-mid" aria-hidden>
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4 shrink-0" aria-hidden>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.25" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
    </svg>
  )
}

export interface UtilityDetailContentProps {
  utility: TripUtility
  partnerName: string
  partnerAddress: string
  partnerHref: string
  isAvailable?: boolean
  hoursSummary?: string
  isOpen?: boolean
  purchasable?: boolean
}

export function UtilityDetailContent({
  utility,
  partnerName,
  partnerAddress,
  partnerHref,
  isAvailable = true,
  hoursSummary,
  isOpen,
  purchasable = false,
}: UtilityDetailContentProps) {
  return (
    <div className="animate-fade-in -mx-4 -mt-6 pb-4">
      <div className="bg-drift-navy-deep px-5 pb-10 pt-5">
        <Link
          href="/trip-help"
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Back to trip help"
        >
          <BackIcon />
        </Link>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-drift-gold-to/30 bg-drift-navy-light">
          <TripUtilityIcon slug={utility.slug} />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
          Trip Help
        </p>
        <h1 className="mt-2 text-3xl font-bold">{utility.label}</h1>
        <p className="mt-2 text-sm text-drift-text-muted">{utility.tagline}</p>
      </div>

      <div className="relative -mt-6 rounded-t-4xl border border-drift-border/60 bg-drift-navy-light px-5 pb-8 pt-6">
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-drift-border/60 bg-drift-navy/50 px-4 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-drift-text-muted">
              Price
            </p>
            <p className="mt-1 text-3xl font-bold text-white">
              {utility.priceLabel}
              <span className="ml-2 text-sm font-normal text-drift-text-muted">
                {utility.priceSubtext}
              </span>
            </p>
          </div>
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold',
              isAvailable
                ? 'border-drift-gold-to/40 bg-drift-gold-gradient/15 text-drift-gold-mid'
                : 'border-drift-border text-drift-text-muted'
            )}
          >
            {isAvailable ? 'Available now' : 'Unavailable'}
          </span>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-drift-text-muted">{utility.description}</p>

        {!isAvailable ? (
          <div className="mt-5">
            <NoProviderEmptyState />
          </div>
        ) : (
          <>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {utility.features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 rounded-xl border border-drift-border/50 bg-drift-navy/40 px-3 py-2.5 text-sm text-white"
            >
              <CheckIcon />
              {feature}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-drift-border/60 bg-drift-navy/40 px-4 py-4">
          <Link href={partnerHref} className="text-base font-bold text-white hover:text-drift-gold-mid">
            {partnerName}
          </Link>
          <p className="mt-3 flex items-start gap-2 text-sm text-drift-text-muted">
            <PinIcon />
            {partnerAddress}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-drift-text-muted">
            <ClockIcon />
            <span>
              {hoursSummary ?? utility.hoursLabel}
              {typeof isOpen === 'boolean' ? (
                <span
                  className={cn(
                    'ml-2 font-semibold',
                    isOpen ? 'text-emerald-400' : 'text-drift-text-subtle'
                  )}
                >
                  · {isOpen ? 'Open now' : 'Closed now'}
                </span>
              ) : null}
            </span>
          </p>
        </div>

        {purchasable ? (
          <ProductPurchaseButton
            productType="trip_help"
            productSlug={utility.slug}
            priceLabel={utility.priceLabel}
            className="mt-6"
          />
        ) : (
          <Link
            href="/pass"
            className="mt-6 flex w-full items-center justify-center rounded-2xl border border-drift-border bg-drift-navy-deep px-6 py-4 text-base font-semibold text-drift-gold-mid transition-colors hover:border-drift-gold-to/40 hover:text-white"
          >
            Show membership pass for member rate
          </Link>
        )}
          </>
        )}
      </div>
    </div>
  )
}
