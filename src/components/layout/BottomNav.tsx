'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

export type BottomNavTab = 'explore' | 'pass' | 'trips'

export interface BottomNavProps {
  /** Until /perks ships, callers may point explore at /dashboard */
  exploreHref?: string
  passHref?: string
  /** Until /trip-help ships, callers may point trips at /dashboard */
  tripsHref?: string
  className?: string
}

function CompassIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-6 w-6"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5 10 14l4.5-4.5Z" fill="currentColor" stroke="none" />
      <path d="m10 14 1.5-4.5L14.5 9.5 10 14Z" />
    </svg>
  )
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M3 6.5 9 4.5l6 2 6-2v13l-6 2-6-2-6 2V6.5Z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </svg>
  )
}

function PassFabIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
      <rect x="4" y="4" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="14" y="4" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="4" y="14" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="14" y="14" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  )
}

function resolveActiveTab(pathname: string): BottomNavTab | null {
  if (pathname.startsWith('/pass')) return 'pass'
  if (pathname.startsWith('/perks')) return 'explore'
  if (pathname.startsWith('/trip-help')) return 'trips'
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/home')) return 'explore'
  return null
}

export function BottomNav({
  exploreHref = '/dashboard',
  passHref = '/pass',
  tripsHref = '/dashboard',
  className,
}: BottomNavProps) {
  const pathname = usePathname()
  const active = resolveActiveTab(pathname)

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t border-drift-border bg-drift-navy-deep/95 backdrop-blur-md pb-safe',
        className
      )}
      aria-label="Main navigation"
    >
      <div className="relative mx-auto flex h-[4.5rem] max-w-lg items-end justify-between px-10">
        <Link
          href={exploreHref}
          className={cn(
            'mb-3 flex min-w-[4rem] flex-col items-center gap-1 text-[10px] font-medium uppercase tracking-wide transition-colors',
            active === 'explore' ? 'text-drift-teal' : 'text-drift-text-muted hover:text-white'
          )}
          aria-current={active === 'explore' ? 'page' : undefined}
        >
          <CompassIcon active={active === 'explore'} />
          Explore
        </Link>

        <Link
          href={passHref}
          className={cn(
            'absolute left-1/2 top-0 flex h-[4.25rem] w-[4.25rem] -translate-x-1/2 -translate-y-4 items-center justify-center rounded-full bg-drift-teal text-drift-navy-deep shadow-drift-fab transition-transform hover:scale-105',
            active === 'pass' && 'ring-2 ring-drift-teal/40'
          )}
          aria-label="Show my pass"
          aria-current={active === 'pass' ? 'page' : undefined}
        >
          <PassFabIcon />
        </Link>

        <Link
          href={tripsHref}
          className={cn(
            'mb-3 flex min-w-[4rem] flex-col items-center gap-1 text-[10px] font-medium uppercase tracking-wide transition-colors',
            active === 'trips' ? 'text-drift-teal' : 'text-drift-text-muted hover:text-white'
          )}
          aria-current={active === 'trips' ? 'page' : undefined}
        >
          <MapIcon active={active === 'trips'} />
          Trips
        </Link>
      </div>
    </nav>
  )
}
