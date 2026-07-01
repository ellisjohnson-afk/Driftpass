import type { ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'

export interface AdminShellProps {
  children: ReactNode
  userLabel?: string
}

export function AdminShell({ children, userLabel }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] lg:flex">
      <AdminSidebar userLabel={userLabel} />
      <main className="flex-1 overflow-auto px-5 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  )
}
