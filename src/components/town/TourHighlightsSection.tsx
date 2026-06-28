import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { TownHighlight } from '@/lib/towns/constants'

export interface TourHighlightsSectionProps {
  highlights: TownHighlight[]
  className?: string
}

export function TourHighlightsSection({ highlights, className }: TourHighlightsSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
          Tour highlights
        </p>
        <h2 className="mt-1 text-lg font-bold text-white">Don&apos;t miss these</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {highlights.map((highlight) => {
          const inner = (
            <>
              <span className="text-2xl" aria-hidden>
                {highlight.emoji}
              </span>
              <div className="mt-3 min-w-0">
                <h3 className="font-semibold text-white">{highlight.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-drift-text-muted">
                  {highlight.description}
                </p>
              </div>
            </>
          )

          if (highlight.href) {
            return (
              <Link
                key={highlight.slug}
                href={highlight.href}
                className="rounded-2xl border border-drift-border/60 bg-drift-navy-light p-4 transition-colors hover:border-drift-gold-to/35"
              >
                {inner}
              </Link>
            )
          }

          return (
            <div
              key={highlight.slug}
              className="rounded-2xl border border-drift-border/60 bg-drift-navy-light p-4"
            >
              {inner}
            </div>
          )
        })}
      </div>
    </section>
  )
}
