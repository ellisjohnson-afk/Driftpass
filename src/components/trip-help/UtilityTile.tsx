import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { TripUtilitySlug } from '@/lib/trip-help/constants'

function LuggageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
      <rect x="7" y="8" width="10" height="12" rx="1.5" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <path d="M12 12v4" />
    </svg>
  )
}

function ShowerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
      <path d="M6 10c0 4 2 6 6 6s6-2 6-6" strokeLinecap="round" />
      <path d="M8 18h.01M12 20h.01M16 18h.01" strokeLinecap="round" />
    </svg>
  )
}

function LaundryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 7h8" strokeLinecap="round" />
    </svg>
  )
}

function CoworkingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
      <path d="M2 8.5 12 4l10 4.5-10 4.5L2 8.5Z" />
      <path d="M6 10.5V16c0 .8 2.7 2 6 2s6-1.2 6-2v-5.5" />
    </svg>
  )
}

function WaterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
      <path d="M12 21c4-4.5 6-7.7 6-10.5A6 6 0 0 0 6 10.5C6 13.3 8 16.5 12 21Z" />
    </svg>
  )
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
      <path d="M5 17h12l-1.5-4.5H7.8L7 7H3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  )
}

const UTILITY_ICONS: Record<TripUtilitySlug, () => ReactNode> = {
  'luggage-storage': LuggageIcon,
  showers: ShowerIcon,
  laundry: LaundryIcon,
  coworking: CoworkingIcon,
  'water-refill': WaterIcon,
  transfers: TransferIcon,
}

export function TripUtilityIcon({ slug, className }: { slug: TripUtilitySlug; className?: string }) {
  const Icon = UTILITY_ICONS[slug]
  return <span className={cn('text-drift-gold-mid', className)}><Icon /></span>
}

export interface UtilityTileProps {
  slug: TripUtilitySlug
  label: string
  href: string
  className?: string
}

export function UtilityTile({ slug, label, href, className }: UtilityTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border border-drift-border/60 bg-drift-navy-light px-3 py-5 text-center transition-colors hover:border-drift-gold-to/40 hover:bg-drift-navy',
        className
      )}
    >
      <TripUtilityIcon slug={slug} />
      <span className="text-xs font-semibold leading-tight text-white">{label}</span>
    </Link>
  )
}
