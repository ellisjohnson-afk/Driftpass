import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4 shrink-0" aria-hidden>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.25" />
    </svg>
  )
}

export interface PartnerMapPreviewProps {
  mapEmbedUrl: string
  directionsUrl: string
  className?: string
}

export function PartnerMapPreview({ mapEmbedUrl, directionsUrl, className }: PartnerMapPreviewProps) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-drift-border/60 bg-drift-navy/40', className)}>
      <div className="relative h-44 w-full">
        <iframe
          title="Partner location map"
          src={mapEmbedUrl}
          className="h-full w-full border-0 grayscale-[20%] contrast-[1.05]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <Link
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-drift-gold-mid transition-colors hover:text-white"
      >
        <PinIcon />
        Open in Maps
      </Link>
    </div>
  )
}
