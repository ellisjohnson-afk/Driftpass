'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  NoDealsNearbyEmptyState,
  NoHistoryEmptyState,
  NoPassEmptyState,
  NoPerkMatchesEmptyState,
  NoPerksNearbyEmptyState,
  NoProviderEmptyState,
} from '@/components/ui'

const tabs = [
  { id: 'perks', label: 'No Perks', emoji: '🗺️' },
  { id: 'matches', label: 'No Matches', emoji: '🔍' },
  { id: 'providers', label: 'No Providers', emoji: '🧭' },
  { id: 'pass', label: 'No Pass', emoji: '🎫' },
  { id: 'history', label: 'No Activity', emoji: '⏰' },
  { id: 'home', label: 'No Deals', emoji: '🏠' },
] as const

type TabId = (typeof tabs)[number]['id']

export function EmptyStatesPreview() {
  const [active, setActive] = useState<TabId>('perks')

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-colors',
              active === tab.id
                ? 'border-drift-gold-to/40 bg-drift-gold-gradient/15 text-drift-gold-mid'
                : 'border-drift-border bg-drift-navy-light text-drift-text-muted hover:text-white'
            )}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {active === 'perks' ? <NoPerksNearbyEmptyState /> : null}
      {active === 'matches' ? (
        <NoPerkMatchesEmptyState onClearFilters={() => undefined} />
      ) : null}
      {active === 'providers' ? <NoProviderEmptyState /> : null}
      {active === 'pass' ? <NoPassEmptyState /> : null}
      {active === 'history' ? <NoHistoryEmptyState /> : null}
      {active === 'home' ? <NoDealsNearbyEmptyState /> : null}
    </div>
  )
}
