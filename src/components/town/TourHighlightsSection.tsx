import Image from 'next/image'
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
        <h2 className="mt-1 text-lg font-bold text-white">Don&apos;t miss the Whitsundays</h2>
        <p className="mt-1 text-sm text-drift-text-muted">
          Day trips and experiences most travellers come for — book locally or check member offers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {highlights.map((highlight) => {
          const cardClass =
            'overflow-hidden rounded-2xl border border-drift-border/60 bg-drift-navy-light transition-colors hover:border-drift-gold-to/35'

          const inner = (
            <>
              {highlight.imageUrl ? (
                <div className="relative h-28 w-full">
                  <Image
                    src={highlight.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 512px) 100vw, 240px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-drift-navy-light via-drift-navy-light/20 to-transparent" />
                  <span className="absolute left-3 top-3 text-xl" aria-hidden>
                    {highlight.emoji}
                  </span>
                </div>
              ) : (
                <span className="block p-4 pb-0 text-2xl" aria-hidden>
                  {highlight.emoji}
                </span>
              )}
              <div className={cn('min-w-0', highlight.imageUrl ? 'p-4 pt-2' : 'p-4 pt-0')}>
                <h3 className="font-semibold text-white">{highlight.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-drift-text-muted">
                  {highlight.description}
                </p>
              </div>
            </>
          )

          if (highlight.href) {
            return (
              <Link key={highlight.slug} href={highlight.href} className={cardClass}>
                {inner}
              </Link>
            )
          }

          return (
            <div key={highlight.slug} className={cardClass}>
              {inner}
            </div>
          )
        })}
      </div>
    </section>
  )
}
