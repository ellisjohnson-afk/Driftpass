import type { ReactNode } from 'react'
import { StatusPill } from '@/components/ui/StatusPill'
import { cn } from '@/lib/utils/cn'

export type MembershipCardVariant = 'compact' | 'full'

export interface MembershipCardProps {
  variant?: MembershipCardVariant
  memberName: string
  memberSince?: string
  isActive?: boolean
  instruction?: string
  children?: ReactNode
  className?: string
}

function ChipGraphic() {
  return (
    <div
      className="flex h-9 w-11 items-center justify-center rounded-md bg-drift-gold-dark/30"
      aria-hidden
    >
      <div className="grid grid-cols-2 gap-0.5 p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-[1px] bg-drift-navy-deep/50" />
        ))}
      </div>
    </div>
  )
}

export function MembershipCard({
  variant = 'compact',
  memberName,
  memberSince,
  isActive = true,
  instruction = 'Show this code to partner businesses',
  children,
  className,
}: MembershipCardProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'bg-drift-gold-gradient shadow-drift-card rounded-3xl p-5 text-drift-navy-deep',
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between">
          <ChipGraphic />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-drift-navy-deep/70">
            Drift Pass
          </span>
        </div>

        <p className="text-xl font-bold leading-tight">{memberName}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-drift-navy-deep/80">
          {isActive && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-drift-teal-dark" />
              Active Member
            </span>
          )}
          {memberSince && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-drift-navy-deep/40" />
              Since {memberSince}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-drift-gold-gradient shadow-drift-card rounded-4xl px-6 py-7 text-drift-navy-deep',
        className
      )}
    >
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-drift-navy-deep/65">
        Drift Pass
      </p>

      <p className="mt-4 text-center text-2xl font-bold">{memberName}</p>

      <div className="mt-3 flex justify-center">
        <StatusPill
          label="Active Member"
          tone="active"
          className="border-drift-teal-dark/20 bg-drift-teal/10 text-drift-navy-deep"
        />
      </div>

      <p className="mt-5 text-center text-sm text-drift-navy-deep/75">{instruction}</p>

      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
