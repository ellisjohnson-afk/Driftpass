import { cn } from '@/lib/utils/cn'

export interface ProfileStat {
  value: string
  label: string
}

export interface ProfileStatsRowProps {
  stats: ProfileStat[]
  className?: string
}

export function ProfileStatsRow({ stats, className }: ProfileStatsRowProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-2xl font-bold text-white">{stat.value}</p>
          <p className="mt-1 text-[11px] leading-tight text-drift-text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
