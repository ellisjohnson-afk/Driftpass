import type { ReactNode } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/lib/utils/cn'

export interface AppShellProps {
  children: ReactNode
  showHeader?: boolean
  showBottomNav?: boolean
  exploreHref?: string
  passHref?: string
  tripsHref?: string
  profileHref?: string
  homeHref?: string
  className?: string
}

function SettingsGearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-5 w-5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

export function AppShell({
  children,
  showHeader = true,
  showBottomNav = true,
  exploreHref = '/perks',
  passHref = '/pass',
  tripsHref = '/trip-help',
  profileHref = '/account',
  homeHref = '/home',
  className,
}: AppShellProps) {
  return (
    <div className={cn('min-h-screen bg-drift-navy-gradient text-white', className)}>
      {showHeader && (
        <header className="sticky top-0 z-40 border-b border-drift-border/60 bg-drift-navy/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
            <Link href={homeHref} className="text-lg font-bold tracking-tight">
              <span className="text-white">Drift</span>
              <span className="text-drift-teal">Pass</span>
            </Link>

            <Link
              href={profileHref}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-drift-border bg-drift-navy-light text-drift-text-muted transition-colors hover:border-drift-teal hover:text-drift-teal"
              aria-label="Profile settings"
            >
              <SettingsGearIcon />
            </Link>
          </div>
        </header>
      )}

      <main className={cn('mx-auto max-w-lg px-4 py-6', showBottomNav && 'pb-28')}>
        {children}
      </main>

      {showBottomNav && (
        <BottomNav
          exploreHref={exploreHref}
          passHref={passHref}
          tripsHref={tripsHref}
        />
      )}
    </div>
  )
}
