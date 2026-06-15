import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export interface PartnerHeroProps {
  imageUrl: string
  backHref?: string
  className?: string
}

export function PartnerHero({ imageUrl, backHref = '/perks', className }: PartnerHeroProps) {
  return (
    <div className={cn('relative h-64 w-full sm:h-72', className)}>
      <Image src={imageUrl} alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-drift-navy-deep/90 via-drift-navy-deep/20 to-black/25" />

      <Link
        href={backHref}
        className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/90 text-drift-navy-deep shadow-sm transition-colors hover:bg-white"
        aria-label="Back to perks"
      >
        <BackIcon />
      </Link>
    </div>
  )
}
