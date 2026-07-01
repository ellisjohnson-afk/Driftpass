import Link from 'next/link'
import { DirectionsButton } from '@/components/partner/DirectionsButton'
import { cn } from '@/lib/utils/cn'
import { getPartnerStaticMapUrl } from '@/lib/partners/detail'

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

export interface TripHelpLocationCardProps {
  partnerName: string
  partnerAddress: string
  partnerHref?: string
  serviceLabel?: string
  hoursSummary?: string
  isOpen?: boolean
  directionsUrl?: string
  lat?: number | null
  lng?: number | null
  className?: string
}

export function TripHelpLocationCard({
  partnerName,
  partnerAddress,
  partnerHref,
  serviceLabel = 'Provided by',
  hoursSummary,
  isOpen,
  directionsUrl,
  lat,
  lng,
  className,
}: TripHelpLocationCardProps) {
  const hasMapPreview = lat != null && lng != null && directionsUrl

  return (
    <section
      id="location"
      className={cn('rounded-2xl border border-drift-border/60 bg-drift-navy/40 px-4 py-4', className)}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
        Where to go
      </p>
      <p className="mt-1 text-xs text-drift-text-muted">{serviceLabel}</p>

      {partnerHref ? (
        <Link href={partnerHref} className="mt-2 inline-block text-lg font-bold text-white hover:text-drift-gold-mid">
          {partnerName}
        </Link>
      ) : (
        <p className="mt-2 text-lg font-bold text-white">{partnerName}</p>
      )}

      <p className="mt-3 flex items-start gap-2 text-sm text-drift-text-muted">
        <PinIcon />
        {partnerAddress}
      </p>

      {hoursSummary ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-drift-text-muted">
          <ClockIcon />
          <span>
            {hoursSummary}
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
      ) : null}

      {hasMapPreview ? (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block overflow-hidden rounded-2xl border border-drift-border/50"
          aria-label={`Open map directions to ${partnerName}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPartnerStaticMapUrl(lat, lng)}
            alt=""
            className="h-36 w-full object-cover"
            loading="lazy"
          />
        </a>
      ) : null}

      {directionsUrl ? (
        <DirectionsButton directionsUrl={directionsUrl} className="mt-4" label="Get directions in Maps" />
      ) : null}
    </section>
  )
}
