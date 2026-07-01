'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ADMIN_NAV_COMING_SOON, ADMIN_NAV_ITEMS } from '@/lib/admin/nav'
import { cn } from '@/lib/utils/cn'

function isActivePath(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export interface AdminSidebarProps {
  userLabel?: string
}

export function AdminSidebar({ userLabel }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#2A2A2A] bg-[#111111] lg:w-64 lg:border-b-0 lg:border-r">
      <div className="border-b border-[#2A2A2A] px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#00FF7F]">
          DriftPass
        </p>
        <h1 className="mt-1 text-lg font-bold text-white">Admin</h1>
        {userLabel ? (
          <p className="mt-1 truncate text-xs text-[#6B7280]">{userLabel}</p>
        ) : null}
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible lg:px-2 lg:py-4">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:px-3 lg:py-2.5',
                active
                  ? 'bg-[#00FF7F]/10 text-[#00FF7F]'
                  : 'text-[#9CA3AF] hover:bg-[#1A1A1A] hover:text-white'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="hidden px-4 py-2 lg:block">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#4B5563]">
          Coming soon
        </p>
        <ul className="mt-2 space-y-1">
          {ADMIN_NAV_COMING_SOON.map((label) => (
            <li
              key={label}
              className="rounded-lg px-3 py-2 text-sm text-[#4B5563]"
              aria-disabled
            >
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto border-t border-[#2A2A2A] px-4 py-4">
        <Link
          href="/account"
          className="flex items-center justify-center rounded-xl border border-[#2A2A2A] px-3 py-2.5 text-sm font-medium text-[#9CA3AF] transition-colors hover:border-[#3A3A3A] hover:text-white lg:justify-start"
        >
          ← Back to app
        </Link>
      </div>
    </aside>
  )
}
