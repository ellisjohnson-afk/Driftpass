import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export interface PerkCardProps {
  slug: string
  name: string
  discountLabel: string
  imageUrl: string
  className?: string
}

export function PerkCard({
  slug,
  name,
  discountLabel,
  imageUrl,
  className,
}: PerkCardProps) {
  return (
    <Link
      href={`/perks/${slug}`}
      className={cn(
        'group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-drift-navy-light shadow-drift-card transition-transform hover:scale-[1.02]',
        className
      )}
    >
      <Image
        src={imageUrl}
        alt=""
        fill
        sizes="(max-width: 512px) 50vw, 240px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/5" />

      <span className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-drift-navy-deep shadow-sm">
        {discountLabel}
      </span>

      <h3 className="absolute bottom-3 left-3 right-3 text-sm font-bold uppercase leading-tight tracking-wide text-white">
        {name}
      </h3>
    </Link>
  )
}
