import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export interface HomeDealCardProps {
  slug: string
  name: string
  city: string
  discountLabel: string
  imageUrl: string
  className?: string
}

export function HomeDealCard({
  slug,
  name,
  city,
  discountLabel,
  imageUrl,
  className,
}: HomeDealCardProps) {
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <span className="absolute right-2 top-2 rounded-full bg-drift-gold-gradient px-2 py-1 text-[10px] font-bold uppercase text-drift-navy-deep shadow-sm">
        {discountLabel}
      </span>

      <div className="absolute bottom-3 left-3 right-3">
        <h3 className="text-sm font-bold leading-tight text-white">{name}</h3>
        <p className="mt-0.5 text-xs text-white/75">{city}</p>
      </div>
    </Link>
  )
}
