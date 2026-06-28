'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

export type TripHelpTab = 'utilities' | 'essentials'

export interface TripHelpTabsProps {
  utilities: ReactNode
  essentials: ReactNode
}

const TABS: Array<{ id: TripHelpTab; label: string }> = [
  { id: 'utilities', label: 'Utilities' },
  { id: 'essentials', label: 'Essentials FAQ' },
]

export function TripHelpTabs({ utilities, essentials }: TripHelpTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get('tab') === 'essentials' ? 'essentials' : 'utilities'
  const [active, setActive] = useState<TripHelpTab>(initialTab)

  useEffect(() => {
    setActive(searchParams.get('tab') === 'essentials' ? 'essentials' : 'utilities')
  }, [searchParams])

  function selectTab(tab: TripHelpTab) {
    setActive(tab)
    const url = tab === 'essentials' ? '/trip-help?tab=essentials' : '/trip-help'
    router.replace(url, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Trip Help sections"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(tab.id)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-drift-gold-gradient text-drift-navy-deep shadow-drift-card'
                  : 'border border-drift-border/60 bg-drift-navy-light text-drift-text-muted hover:text-white'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" hidden={active !== 'utilities'}>
        {active === 'utilities' ? utilities : null}
      </div>
      <div role="tabpanel" hidden={active !== 'essentials'}>
        {active === 'essentials' ? essentials : null}
      </div>
    </div>
  )
}
