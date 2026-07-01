import { FeaturedShoutoutCard } from './FeaturedShoutoutCard'
import type { FeaturedShoutoutDisplay } from '@/lib/shoutouts/types'
import { cn } from '@/lib/utils/cn'

export interface FeaturedShoutoutsStripProps {
  shoutouts: FeaturedShoutoutDisplay[]
  title?: string
  className?: string
  compact?: boolean
}

export function FeaturedShoutoutsStrip({
  shoutouts,
  title = 'Featured this week',
  className,
  compact = false,
}: FeaturedShoutoutsStripProps) {
  if (shoutouts.length === 0) return null

  return (
    <section className={cn('space-y-3', className)} aria-label="Featured local businesses">
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <p className="text-xs text-drift-text-muted">Local businesses supporting DriftPass</p>
      </div>

      <div className={cn('grid gap-3', shoutouts.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
        {shoutouts.map((shoutout) => (
          <FeaturedShoutoutCard key={shoutout.id} shoutout={shoutout} compact={compact} />
        ))}
      </div>
    </section>
  )
}
