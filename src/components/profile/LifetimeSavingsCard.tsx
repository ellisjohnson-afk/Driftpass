import { formatAUD } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export interface LifetimeSavingsCardProps {
  amountCents: number
  className?: string
}

export function LifetimeSavingsCard({ amountCents, className }: LifetimeSavingsCardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl bg-drift-gold-gradient px-6 py-7 text-center text-drift-navy-deep shadow-drift-card',
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-drift-navy-deep/65">
        Lifetime savings
      </p>
      <p className="mt-2 text-4xl font-bold tracking-tight">{formatAUD(amountCents)}</p>
      <p className="mt-2 text-sm text-drift-navy-deep/75">You&apos;ve saved with Drift Pass</p>
    </div>
  )
}
