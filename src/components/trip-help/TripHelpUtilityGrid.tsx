import type { TripHelpProductDisplay } from '@/lib/trip-help/product-types'
import { UtilityTile } from './UtilityTile'
import { cn } from '@/lib/utils/cn'

export interface TripHelpUtilityGridProps {
  utilities: TripHelpProductDisplay[]
  className?: string
}

export function TripHelpUtilityGrid({ utilities, className }: TripHelpUtilityGridProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {utilities.map((utility) => (
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
