import { cn } from '@/lib/utils/cn'

type StatusTone = 'active' | 'available' | 'neutral'

const toneClasses: Record<StatusTone, string> = {
  active: 'bg-drift-teal/15 text-drift-teal border-drift-teal/30',
  available: 'bg-drift-teal/10 text-drift-teal-dark border-drift-teal/20',
  neutral: 'bg-white/10 text-drift-text-muted border-drift-border',
}

export interface StatusPillProps {
  label: string
  tone?: StatusTone
  showDot?: boolean
  className?: string
}

export function StatusPill({
  label,
  tone = 'active',
  showDot = true,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        toneClasses[tone],
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            tone === 'active' ? 'bg-drift-teal' : 'bg-drift-text-muted'
          )}
        />
      )}
      {label}
    </span>
  )
}
