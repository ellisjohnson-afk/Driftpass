import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button } from './Button'

export interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: ReactNode
}

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

function EmptyStateActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction
  variant: 'primary' | 'secondary'
}) {
  const className =
    variant === 'secondary'
      ? 'text-sm font-semibold text-drift-text-muted transition-colors hover:text-white'
      : undefined

  if (action.href) {
    if (variant === 'secondary') {
      return (
        <Link href={action.href} className={className}>
          {action.label}
        </Link>
      )
    }

    return (
      <Link href={action.href} className="inline-flex w-full max-w-xs">
        <Button variant="gold" size="md" fullWidth className="gap-2">
          {action.icon}
          {action.label}
        </Button>
      </Link>
    )
  }

  if (variant === 'secondary') {
    return (
      <button type="button" onClick={action.onClick} className={className}>
        {action.label}
      </button>
    )
  }

  return (
    <Button variant="gold" size="md" fullWidth className="max-w-xs gap-2" onClick={action.onClick}>
      {action.icon}
      {action.label}
    </Button>
  )
}

/**
 * Reusable empty state — Figma screen #10 (Empty States).
 * Shown when a list or search has nothing to display.
 */
export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-drift-border/60 bg-drift-navy-light px-6 py-10 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {icon}
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-drift-text-muted">
        {description}
      </p>
      {primaryAction || secondaryAction ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          {primaryAction ? (
            <EmptyStateActionButton action={primaryAction} variant="primary" />
          ) : null}
          {secondaryAction ? (
            <EmptyStateActionButton action={secondaryAction} variant="secondary" />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
