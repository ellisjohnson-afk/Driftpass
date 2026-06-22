'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

export type BottomNavTab = 'explore' | 'pass' | 'trips' | 'profile'

export interface BottomNavProps {
  exploreHref?: string
  passHref?: string
  tripsHref?: string
  profileHref?: string
  className?: string
}

function CompassIcon() {
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

function MapIcon() {
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

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-6 w-6"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
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

function NavItem({
  href,
  label,
  active,
  icon,
}: {
  href: string
  label: string
  active: boolean
  icon: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-end gap-1 pb-3 text-[10px] font-medium uppercase tracking-wide transition-colors',
        active ? 'text-drift-gold-mid' : 'text-drift-text-muted hover:text-white'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      {label}
    </Link>
  )
}

function resolveActiveTab(pathname: string): BottomNavTab | null {
  if (pathname.startsWith('/pass')) return 'pass'
  if (pathname.startsWith('/account')) return 'profile'
  if (pathname.startsWith('/perks')) return 'explore'
  if (pathname.startsWith('/trip-help')) return 'trips'
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/home')) return 'explore'
  return null
}

export function BottomNav({
  exploreHref = '/perks',
  passHref = '/pass',
  tripsHref = '/trip-help',
  profileHref = '/account',
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
      <div className="relative mx-auto grid h-[4.5rem] max-w-lg grid-cols-4 items-end px-2">
        <NavItem
          href={exploreHref}
          label="Explore"
          active={active === 'explore'}
          icon={<CompassIcon />}
        />

        <NavItem
          href={tripsHref}
          label="Trips"
          active={active === 'trips'}
          icon={<MapIcon />}
        />

        <div className="relative flex justify-center">
          <Link
            href={passHref}
            className={cn(
              'absolute bottom-3 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-drift-gold-gradient text-drift-navy-deep shadow-drift-fab transition-transform hover:scale-105',
              active === 'pass' && 'ring-2 ring-drift-gold-to/50'
            )}
            aria-label="Show my pass"
            aria-current={active === 'pass' ? 'page' : undefined}
          >
            <PassFabIcon />
          </Link>
        </div>

        <NavItem
          href={profileHref}
          label="Profile"
          active={active === 'profile'}
          icon={<ProfileIcon />}
        />
      </div>
    </nav>
  )
}
