import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export interface PerksEmptyStateProps {
  title: string
  description: string
  onClearFilters?: () => void
  className?: string
}

export function PerksEmptyState({
  title,
  description,
  onClearFilters,
  className,
}: PerksEmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-drift-border/60 bg-drift-navy-light px-6 py-10 text-center',
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-drift-navy-deep/60 text-3xl">
        🗺️
      </div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-drift-text-muted">
        {description}
      </p>
      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-6 rounded-2xl bg-drift-gold-gradient px-5 py-3 text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
        >
          Clear filters
        </button>
      ) : (
        <Link
          href="/pass"
          className="mt-6 inline-flex rounded-2xl bg-drift-gold-gradient px-5 py-3 text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
        >
          Show my pass
        </Link>
      )}
    </div>
  )
}
