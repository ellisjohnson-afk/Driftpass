'use client'

import { cn } from '@/lib/utils/cn'
import type { PartnerHoursDay } from '@/lib/partners/detail'

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
    </svg>
  )
}

export interface PartnerOpeningHoursProps {
  hours: PartnerHoursDay[]
  isOpen: boolean
  className?: string
}

export function PartnerOpeningHours({ hours, isOpen, className }: PartnerOpeningHoursProps) {
  return (
    <details className={cn('group rounded-2xl border border-drift-border/60 bg-drift-navy/40', className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <ClockIcon />
          <span className="text-sm font-semibold text-white">Opening hours</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              isOpen ? 'text-drift-gold-mid' : 'text-drift-text-muted'
            )}
          >
            {isOpen ? 'Open now' : 'Closed'}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 text-drift-text-muted transition-transform group-open:rotate-180"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </summary>

      <div className="space-y-2 border-t border-drift-border/60 px-4 py-3">
        {hours.map((row) => (
          <div key={row.day} className="flex justify-between gap-4 text-sm">
            <span className="text-drift-text-muted">{row.day}</span>
            <span className="text-white">{row.hours}</span>
          </div>
        ))}
      </div>
    </details>
  )
}
