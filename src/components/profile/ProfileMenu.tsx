'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MenuButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium text-white transition-colors hover:bg-drift-navy/60 disabled:cursor-default disabled:opacity-70"
    >
      <span>{label}</span>
      <ChevronIcon />
    </button>
  )
}

export interface ProfileMenuProps {
  showBilling?: boolean
  className?: string
}

export function ProfileMenu({ showBilling = true, className }: ProfileMenuProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openBillingPortal() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }

      if (data.url) {
        window.location.href = data.url
        return
      }

      setError(data.error ?? 'Could not open billing portal. Try again.')
    } catch {
      setError('Could not open billing portal. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-drift-border/60 bg-drift-navy-light', className)}>
      {showBilling ? (
        <MenuButton
          label={loading ? 'Opening payment methods…' : 'Payment methods'}
          onClick={() => void openBillingPortal()}
          disabled={loading}
        />
      ) : null}
      <div className="border-t border-drift-border/60">
        <MenuButton label="Notifications" disabled />
      </div>
      {error ? <p className="px-4 pb-3 text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
