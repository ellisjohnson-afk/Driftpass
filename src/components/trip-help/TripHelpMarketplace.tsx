import Link from 'next/link'
import { TRIP_MARKETPLACE } from '@/lib/trip-help/constants'
import { cn } from '@/lib/utils/cn'

export interface TripHelpMarketplaceProps {
  className?: string
}

export function TripHelpMarketplace({ className }: TripHelpMarketplaceProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h2 className="text-lg font-bold">Marketplace</h2>
        <p className="text-sm text-drift-text-muted">Browse exclusive member offers</p>
      </div>

      <div className="space-y-3">
        {TRIP_MARKETPLACE.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl border border-drift-border/60 bg-drift-navy-light px-4 py-4 transition-colors hover:border-drift-gold-to/35"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-drift-navy text-xl" aria-hidden>
              {item.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="text-sm text-drift-text-muted">{item.description}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-drift-gold-mid">{item.priceLabel}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
