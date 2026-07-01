import Link from 'next/link'
import type { TripHelpProductDisplay } from '@/lib/trip-help/product-types'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TripToursHub({ tours }: { tours: TripHelpProductDisplay[] }) {
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

        <span className="text-3xl" aria-hidden>
          🚢
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
          Trip Help
        </p>
        <h1 className="mt-2 text-3xl font-bold">Tours & Experiences</h1>
        <p className="mt-2 text-sm text-drift-text-muted">
          Book with local operators — each trip shows where to check in and how to get there.
        </p>
      </div>

      <div className="relative -mt-6 space-y-3 rounded-t-4xl border border-drift-border/60 bg-drift-navy-light px-5 pb-8 pt-6">
        {tours.map((tour) => (
          <Link
            key={tour.slug}
            href={`/trip-help/marketplace/${tour.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-drift-border/60 bg-drift-navy/40 px-4 py-4 transition-colors hover:border-drift-gold-to/35"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-drift-navy text-xl"
              aria-hidden
            >
              {tour.emoji ?? '🚢'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{tour.label}</p>
              <p className="text-sm text-drift-text-muted">
                {tour.partnerDisplayName} · {tour.tagline ?? tour.description}
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold text-drift-gold-mid">{tour.priceLabel}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
