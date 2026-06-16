import type { InputHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export function AuthShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-drift-navy-deep px-4 py-12">
      <div className={cn('w-full max-w-sm', className)}>
        <Link href="/" className="mb-8 block text-center">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">Drift</span>
            <span className="text-drift-gold-mid">Pass</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  )
}

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-drift-border/60 bg-drift-navy-light p-8 shadow-drift-card">
      <h1 className="text-xl font-bold">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-drift-text-muted">{subtitle}</p> : null}
      <div className={subtitle ? 'mt-6' : 'mt-6'}>{children}</div>
    </div>
  )
}

export function AuthInput({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label ? <label className="mb-1.5 block text-sm text-drift-text-muted">{label}</label> : null}
      <input
        {...props}
        className={cn(
          'w-full rounded-xl border border-drift-border bg-drift-navy-deep px-4 py-3 text-white placeholder:text-drift-text-subtle transition-colors focus:border-drift-gold-to/50 focus:outline-none disabled:opacity-60',
          className
        )}
      />
    </div>
  )
}

type AuthAlertTone = 'error' | 'success' | 'info'

const alertToneClasses: Record<AuthAlertTone, string> = {
  error: 'border-red-800/60 bg-red-900/25 text-red-300',
  success: 'border-drift-gold-to/30 bg-drift-gold-gradient/10 text-drift-gold-mid',
  info: 'border-drift-border/60 bg-drift-navy/50 text-drift-text-muted',
}

export function AuthAlert({
  tone,
  children,
  className,
}: {
  tone: AuthAlertTone
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-4 rounded-xl border px-4 py-3 text-sm',
        alertToneClasses[tone],
        className
      )}
    >
      {children}
    </div>
  )
}

export function AuthPrimaryButton({
  children,
  className,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-2xl bg-drift-gold-gradient px-6 py-3 text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-drift-navy-deep border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}

export function AuthSecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'w-full rounded-xl border border-drift-border py-2.5 text-sm text-drift-text-muted transition-colors hover:border-drift-gold-to/40 hover:text-white disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  )
}

export function AuthLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link href={href} className="font-semibold text-drift-gold-mid hover:text-white hover:underline">
      {children}
    </Link>
  )
}
