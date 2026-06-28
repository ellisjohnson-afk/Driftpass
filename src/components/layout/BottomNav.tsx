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

function TripHelpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.25" />
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

function PassCardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="7.5" cy="14" r="1.25" fill="currentColor" />
      <path
        d="M11 14h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NavItem({
  href,
  label,
  active,
  icon,
  multiline = false,
}: {
  href: string
  label: string
  active: boolean
  icon: ReactNode
  multiline?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex min-h-[3.25rem] flex-col items-center justify-end gap-1 pb-3 transition-colors',
        active ? 'text-drift-gold-mid' : 'text-drift-text-muted hover:text-white'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      <span
        className={cn(
          'text-center font-semibold uppercase tracking-wide',
          multiline ? 'max-w-[4.25rem] text-[9px] leading-[1.15]' : 'text-[10px]'
        )}
      >
        {multiline && label.includes(' ') ? (
          <>
            {label.split(' ').map((word) => (
              <span key={word} className="block">
                {word}
              </span>
            ))}
          </>
        ) : (
          label
        )}
      </span>
    </Link>
  )
}

function PassNavButton({ href, active }: { href: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-end gap-1.5 pb-3">
      <Link
        href={href}
        className={cn(
          '-mt-7 flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-full bg-drift-gold-gradient text-drift-navy-deep shadow-drift-fab ring-2 transition-transform hover:scale-105',
          active
            ? 'ring-drift-gold-to/60'
            : 'ring-drift-navy-deep'
        )}
        aria-label="Show my pass"
        aria-current={active ? 'page' : undefined}
      >
        <PassCardIcon />
      </Link>
      <span
        className={cn(
          'text-[10px] font-bold uppercase tracking-wide',
          active ? 'text-drift-gold-mid' : 'text-drift-text-muted'
        )}
      >
        My Pass
      </span>
    </div>
  )
}

function resolveActiveTab(pathname: string): BottomNavTab | null {
  if (pathname.startsWith('/pass')) return 'pass'
  if (pathname.startsWith('/account')) return 'profile'
  if (pathname.startsWith('/perks')) return 'explore'
  if (pathname.startsWith('/town')) return 'explore'
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
      <div className="relative mx-auto grid h-[5rem] max-w-lg grid-cols-4 items-end px-1">
        <NavItem
          href={exploreHref}
          label="Explore"
          active={active === 'explore'}
          icon={<CompassIcon />}
        />

        <NavItem
          href={tripsHref}
          label="Trip Help"
          active={active === 'trips'}
          icon={<TripHelpIcon />}
          multiline
        />

        <PassNavButton href={passHref} active={active === 'pass'} />

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
