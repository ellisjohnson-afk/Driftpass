import { cn } from '@/lib/utils/cn'

export interface PartnerStarRatingProps {
  rating: number
  className?: string
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
      <path
        d="M10 1.5 12.6 7l6 .9-4.3 4.2 1 5.9L10 15.8 4.7 18l1-5.9L1.4 7.9l6-.9L10 1.5Z"
        className={filled ? 'fill-drift-gold-mid' : 'fill-drift-border'}
      />
    </svg>
  )
}

export function PartnerStarRating({ rating, className }: PartnerStarRatingProps) {
  const clamped = Math.max(0, Math.min(5, rating))
  const fullStars = Math.floor(clamped)
  const hasHalf = clamped - fullStars >= 0.25 && clamped - fullStars < 0.75
  const roundedFull = clamped - fullStars >= 0.75 ? fullStars + 1 : fullStars

  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index} filled={index < roundedFull || (hasHalf && index === roundedFull)} />
      ))}
      <span className="ml-1 text-xs text-drift-text-muted">{clamped.toFixed(1)}</span>
    </div>
  )
}
