'use client'

import { cn } from '@/lib/utils/cn'

export interface PerkSearchBarProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 shrink-0 text-drift-text-muted"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

export function PerkSearchBar({ value, onChange, className }: PerkSearchBarProps) {
  return (
    <label className={cn('block', className)}>
      <span className="sr-only">Search deals and experiences</span>
      <div className="flex items-center gap-3 rounded-2xl border border-drift-border/60 bg-drift-navy-light px-4 py-3.5 shadow-sm">
        <SearchIcon />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search deals & experiences"
          className="w-full bg-transparent text-sm text-white placeholder:text-drift-text-muted focus:outline-none"
        />
      </div>
    </label>
  )
}
