import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5 shrink-0" aria-hidden>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.25" />
    </svg>
  )
}

export interface DirectionsButtonProps {
  directionsUrl: string
  label?: string
  className?: string
  variant?: 'primary' | 'secondary'
}

export function DirectionsButton({
  directionsUrl,
  label = 'Get directions',
  className,
  variant = 'primary',
}: DirectionsButtonProps) {
  return (
    <Link
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all',
        variant === 'primary'
          ? 'bg-drift-gold-gradient text-drift-navy-deep shadow-drift-card hover:brightness-105'
          : 'border border-drift-border bg-drift-navy-deep text-drift-gold-mid hover:border-drift-gold-to/40 hover:text-white',
        className
      )}
    >
      <PinIcon />
      {label}
    </Link>
  )
}
