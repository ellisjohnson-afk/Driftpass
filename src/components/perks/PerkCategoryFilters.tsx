'use client'

import { PERK_FILTERS, type PerkFilterId } from '@/lib/perks/constants'
import { cn } from '@/lib/utils/cn'

export interface PerkCategoryFiltersProps {
  active: PerkFilterId
  onChange: (filter: PerkFilterId) => void
  className?: string
}

export function PerkCategoryFilters({
  active,
  onChange,
  className,
}: PerkCategoryFiltersProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      role="tablist"
      aria-label="Filter perks by category"
    >
      {PERK_FILTERS.map((filter) => {
        const isActive = active === filter.id

        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-drift-gold-gradient text-drift-navy-deep shadow-drift-card'
                : 'border border-drift-border/60 bg-drift-navy-light text-drift-text-muted hover:text-white'
            )}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
