import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { DirectionsButton } from '@/components/partner/DirectionsButton'
import { getPartnerDirectionsUrl } from '@/lib/partners/detail'
import { TourHighlightsSection } from './TourHighlightsSection'
import type { Town } from '@/lib/towns/constants'

function QuickLink({
  href,
  emoji,
  title,
  subtitle,
}: {
  href: string
  emoji: string
  title: string
  subtitle: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-drift-border/60 bg-drift-navy-light px-4 py-3.5 transition-colors hover:border-drift-gold-to/35"
    >
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-white">{title}</p>
        <p className="text-xs text-drift-text-muted">{subtitle}</p>
      </div>
    </Link>
  )
}

export interface TownWelcomeContentProps {
  town: Town
}

export function TownWelcomeContent({ town }: TownWelcomeContentProps) {
  const directionsUrl = getPartnerDirectionsUrl(
    town.mapCenter.lat,
    town.mapCenter.lng,
    `${town.name}, ${town.state}`
  )

  return (
    <div className="animate-fade-in -mx-4 -mt-6 pb-4">
      <div className="bg-drift-navy-deep px-5 pb-12 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-drift-gold-mid">
          {town.region} · {town.state}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">Welcome to {town.name}</h1>
        <p className="mt-2 text-lg font-medium text-drift-gold-mid">{town.welcomeLead}</p>
        <p className="mt-3 text-sm leading-relaxed text-drift-text-muted">{town.welcomeBody}</p>
      </div>

      <div className="relative -mt-6 space-y-6 rounded-t-4xl border border-drift-border/60 bg-drift-navy-light px-5 pb-8 pt-6">
        <DirectionsButton directionsUrl={directionsUrl} label="Get directions to town" />

        <div className="grid grid-cols-1 gap-2">
          <QuickLink
            href="/trip-help"
            emoji="🧳"
            title="Trip Help"
            subtitle="Luggage, showers, WiFi & more"
          />
          <QuickLink
            href="/perks"
            emoji="✨"
            title="Explore perks"
            subtitle="Member deals with local partners"
          />
          <QuickLink
            href="/trip-help?tab=essentials"
            emoji="💡"
            title="Local essentials"
            subtitle="FAQ for travellers & van lifers"
          />
          <QuickLink
            href="/flash"
            emoji="⚡"
            title="Flash passes"
            subtitle="Last-minute tour deals"
          />
        </div>

        <TourHighlightsSection highlights={town.highlights} />

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
                Essentials
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">Traveller FAQ</h2>
            </div>
            <Link
              href="/trip-help?tab=essentials"
              className="text-xs font-semibold text-drift-gold-mid hover:text-white"
            >
              See all
            </Link>
          </div>

          <div className="space-y-2">
            {town.essentials.slice(0, 3).map((item) => (
              <details
                key={item.id}
                className="group rounded-2xl border border-drift-border/60 bg-drift-navy/40 px-4 py-3"
              >
                <summary className="cursor-pointer list-none font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    <span>{item.question}</span>
                    <span className="shrink-0 text-drift-gold-mid transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-drift-text-muted">{item.answer}</p>
                {item.utilityHref ? (
                  <Link
                    href={item.utilityHref}
                    className="mt-3 inline-flex text-sm font-semibold text-drift-gold-mid hover:text-white"
                  >
                    Open in Trip Help →
                  </Link>
                ) : null}
              </details>
            ))}
          </div>
        </section>

        <Link
          href="/pass"
          className={cn(
            'flex w-full items-center justify-center rounded-2xl bg-drift-gold-gradient px-6 py-4 text-base font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105'
          )}
        >
          Show my pass
        </Link>
      </div>
    </div>
  )
}
