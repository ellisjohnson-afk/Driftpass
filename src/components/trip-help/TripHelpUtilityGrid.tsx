import { TRIP_UTILITIES } from '@/lib/trip-help/constants'
import { UtilityTile } from './UtilityTile'
import { cn } from '@/lib/utils/cn'

export interface TripHelpUtilityGridProps {
  className?: string
}

export function TripHelpUtilityGrid({ className }: TripHelpUtilityGridProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {TRIP_UTILITIES.map((utility) => (
        <UtilityTile
          key={utility.slug}
          slug={utility.slug}
          label={utility.shortLabel}
          partnerName={utility.partnerDisplayName}
          priceLabel={utility.priceLabel}
          href={`/trip-help/${utility.slug}`}
        />
      ))}
    </div>
  )
}
