import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export interface PartnerOfferCardProps {
  offerText: string
  passHref?: string
  className?: string
}

export function PartnerOfferCard({
  offerText,
  passHref = '/pass',
  className,
}: PartnerOfferCardProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl border border-drift-gold-to/35 bg-drift-gold-gradient/10 px-4 py-4',
        className
      )}
    >
      <p className="text-base font-bold leading-snug text-white">{offerText}</p>
      <Link
        href={passHref}
        className="shrink-0 rounded-xl bg-drift-gold-gradient px-4 py-2.5 text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
      >
        Claim offer
      </Link>
    </div>
  )
}
