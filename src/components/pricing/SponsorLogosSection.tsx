import Link from 'next/link'
import type { TownSponsor } from '@/lib/towns/constants'

export interface SponsorLogosSectionProps {
  sponsors?: TownSponsor[]
}

/**
 * Layer 2 — founding partner sponsors on pricing.
 * Pass sponsors from town data; falls back to launch placeholder.
 */
export function SponsorLogosSection({ sponsors = [] }: SponsorLogosSectionProps) {
  const hasSponsors = sponsors.length > 0

  return (
    <section className="pt-2 text-center" aria-label="Membership sponsors">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-drift-text-muted">
        Supported by
      </p>

      {hasSponsors ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {sponsors.map((sponsor) => (
            <Link
              key={sponsor.slug}
              href={`/perks/${sponsor.slug}`}
              className="flex min-w-[6.5rem] flex-col items-center justify-center rounded-xl border border-drift-border/50 bg-drift-navy-light/80 px-3 py-2.5 transition-colors hover:border-drift-gold-to/35"
            >
              <span className="text-xs font-bold text-white">{sponsor.name}</span>
              {sponsor.tagline ? (
                <span className="mt-0.5 text-[10px] text-drift-text-subtle">{sponsor.tagline}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-center gap-3">
          {['Sponsor A', 'Sponsor B', 'Sponsor C'].map((label) => (
            <div
              key={label}
              className="flex h-10 w-20 items-center justify-center rounded-lg border border-drift-border/40 bg-drift-navy-light/60 text-[9px] font-medium uppercase tracking-wide text-drift-text-subtle"
              aria-hidden
            >
              {label}
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] text-drift-text-subtle">
        {hasSponsors
          ? 'Founding Airlie Beach partners backing the DriftPass launch'
          : 'Local partner sponsors — coming to Airlie Beach launch'}
      </p>
    </section>
  )
}
