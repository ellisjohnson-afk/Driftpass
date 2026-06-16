import { MEMBERSHIP_INCLUSIONS } from '@/constants/plans'
import { cn } from '@/lib/utils/cn'

export interface MembershipPricingCardProps {
  onStart: () => void
  loading?: boolean
  className?: string
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
      <circle cx="8" cy="8" r="7" className="stroke-drift-navy-deep/25" strokeWidth="1.5" />
      <path
        d="M5 8l2 2 4-4"
        className="stroke-drift-navy-deep/70"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MembershipPricingCard({
  onStart,
  loading = false,
  className,
}: MembershipPricingCardProps) {
  return (
    <div
      className={cn(
        'bg-drift-gold-gradient shadow-drift-card relative overflow-hidden rounded-4xl p-6 text-drift-navy-deep',
        className
      )}
    >
      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-drift-navy-deep/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-drift-gold-mid">
        <span aria-hidden>★</span> Popular
      </div>

      <div className="pr-20">
        <h2 className="text-xl font-bold leading-tight">Drift Pass Membership</h2>
        <p className="mt-1 text-sm text-drift-navy-deep/75">
          One membership for the traveller lifestyle
        </p>
      </div>

      <div className="mt-6 flex items-end gap-1">
        <span className="text-5xl font-bold leading-none">$7.99</span>
        <span className="mb-1 text-lg font-medium text-drift-navy-deep/70">/week</span>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-drift-navy-deep/60">
          Included:
        </p>
        <ul className="mt-3 space-y-2.5">
          {MEMBERSHIP_INCLUSIONS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={loading}
        className="mt-8 w-full rounded-2xl bg-drift-gold-dark py-4 text-base font-bold text-drift-navy-deep shadow-md transition-all hover:brightness-110 disabled:opacity-60"
      >
        {loading ? 'Starting checkout…' : 'Start Membership'}
      </button>
      <p className="mt-3 text-center text-xs text-drift-navy-deep/60">
        Billed weekly · Cancel anytime
      </p>
    </div>
  )
}
