'use client'

import { useMemo, useState } from 'react'
import type { PerkFilterId } from '@/lib/perks/constants'
import { filterPerksBySearch, partnerMatchesFilter } from '@/lib/perks/filters'
import type { PartnerCategory } from '@/types'
import { PerkCard } from './PerkCard'
import { PerkCategoryFilters } from './PerkCategoryFilters'
import { PerkSearchBar } from './PerkSearchBar'
import { PerksEmptyState } from './PerksEmptyState'

export interface PerkListItem {
  id: string
  name: string
  slug: string
  city: string
  category: string
  discountLabel: string
  imageUrl: string
  serviceTypes: string[]
}

export interface PerksExplorerProps {
  perks: PerkListItem[]
}

export function PerksExplorer({ perks }: PerksExplorerProps) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<PerkFilterId>('all')

  const visiblePerks = useMemo(() => {
    const filtered = perks.filter((perk) =>
      partnerMatchesFilter(
        {
          id: perk.id,
          name: perk.name,
          slug: perk.slug,
          category: perk.category as PartnerCategory,
          city: perk.city,
          serviceTypes: perk.serviceTypes,
        },
        activeFilter
      )
    )

    return filterPerksBySearch(filtered, query)
  }, [activeFilter, perks, query])

  const hasFilters = query.trim().length > 0 || activeFilter !== 'all'

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <p className="text-xs uppercase tracking-widest text-drift-gold-mid">Explore</p>
        <h1 className="mt-1 text-xl font-bold">Deals & experiences</h1>
        <p className="mt-1 text-sm text-drift-text-muted">
          Member discounts across gyms, cafés, tours, and more.
        </p>
      </header>

      <PerkSearchBar value={query} onChange={setQuery} />
      <PerkCategoryFilters active={activeFilter} onChange={setActiveFilter} />

      {visiblePerks.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 pb-2">
          {visiblePerks.map((perk) => (
            <PerkCard
              key={perk.id}
              slug={perk.slug}
              name={perk.name}
              discountLabel={perk.discountLabel}
              imageUrl={perk.imageUrl}
            />
          ))}
        </div>
      ) : perks.length === 0 ? (
        <PerksEmptyState
          title="No perks nearby"
          description="We're adding partners across Australia. Check back soon or show your pass when you find a DriftPass partner."
        />
      ) : (
        <PerksEmptyState
          title="No matches found"
          description="Try a different search or category. New partners are added regularly."
          onClearFilters={
            hasFilters
              ? () => {
                  setQuery('')
                  setActiveFilter('all')
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
