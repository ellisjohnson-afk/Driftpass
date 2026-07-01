import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { FeaturedShoutoutDisplay } from '@/lib/shoutouts/types'

export interface FeaturedShoutoutCardProps {
  shoutout: FeaturedShoutoutDisplay
  className?: string
  compact?: boolean
}

export function FeaturedShoutoutCard({
  shoutout,
  className,
  compact = false,
}: FeaturedShoutoutCardProps) {
  return (
    <Link
      href={shoutout.ctaHref}
      className={cn(
        'group block overflow-hidden rounded-2xl border border-drift-gold-to/25 bg-drift-navy-light transition-colors hover:border-drift-gold-to/45',
        className
      )}
    >
      <div className={cn('relative w-full', compact ? 'h-28' : 'h-36')}>
        <Image
          src={shoutout.imageUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition-transform group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-drift-navy-deep via-drift-navy-deep/50 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-drift-gold-to/40 bg-drift-navy-deep/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-drift-gold-mid">
          Featured
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-drift-text-muted">
          {shoutout.businessName}
        </p>
        <p className="mt-1 font-bold text-white">{shoutout.headline}</p>
        {!compact && shoutout.body ? (
          <p className="mt-1 line-clamp-2 text-sm text-drift-text-muted">{shoutout.body}</p>
        ) : null}
        <p className="mt-2 text-sm font-semibold text-drift-gold-mid group-hover:text-white">
          {shoutout.ctaLabel} →
        </p>
      </div>
    </Link>
  )
}
