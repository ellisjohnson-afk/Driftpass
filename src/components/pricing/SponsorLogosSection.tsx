import Image from 'next/image'
import Link from 'next/link'
import { getPerkImageUrl } from '@/lib/perks/constants'
import type { TownSponsor } from '@/lib/towns/constants'
import type { PartnerCategory } from '@/types'

export interface SponsorLogosSectionProps {
  sponsors?: TownSponsor[]
}

const SPONSOR_CATEGORY: Record<string, PartnerCategory> = {
  'airlie-beach-fit': 'gym_fitness',
  'le-shack': 'scooter_hire',
  'frequent-seas': 'cafe_cowork',
  'frozen-yogurt-place': 'restaurant',
}

/**
 * Layer 2 — founding partner sponsors on pricing.
 */
export function SponsorLogosSection({ sponsors = [] }: SponsorLogosSectionProps) {
  const hasSponsors = sponsors.length > 0

  return (
    <section className="pt-2 text-center" aria-label="Membership sponsors">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-drift-text-muted">
        Supported by founding partners
      </p>

      {hasSponsors ? (
        <div className="mt-4 flex flex-wrap items-stretch justify-center gap-3">
          {sponsors.map((sponsor) => {
            const category = SPONSOR_CATEGORY[sponsor.slug] ?? 'other'
            const imageUrl = getPerkImageUrl(sponsor.slug, category)

            return (
              <Link
                key={sponsor.slug}
                href={`/perks/${sponsor.slug}`}
                className="flex w-[7.5rem] flex-col overflow-hidden rounded-xl border border-drift-border/50 bg-drift-navy-light/80 transition-colors hover:border-drift-gold-to/35"
              >
                <div className="relative h-16 w-full">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-drift-navy-light/90 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col items-center justify-center px-2 py-2.5">
                  <span className="text-center text-[11px] font-bold leading-tight text-white">
                    {sponsor.name}
                  </span>
                  {sponsor.tagline ? (
                    <span className="mt-0.5 text-center text-[9px] text-drift-text-subtle">
                      {sponsor.tagline}
                    </span>
                  ) : null}
                </div>
              </Link>
            )
          })}
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
          ? 'Airlie Beach businesses backing the DriftPass launch'
          : 'Local partner sponsors — coming to Airlie Beach launch'}
      </p>
    </section>
  )
}
