import { DirectionsButton } from './DirectionsButton'
import { cn } from '@/lib/utils/cn'

export interface PartnerMapPreviewProps {
  directionsUrl: string
  address?: string
  className?: string
}

/** Layer 2 — directions link only (no embedded map). */
export function PartnerMapPreview({ directionsUrl, address, className }: PartnerMapPreviewProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {address ? (
        <div className="rounded-2xl border border-drift-border/60 bg-drift-navy/40 px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-drift-text-muted">Address</p>
          <p className="mt-2 text-sm text-white">{address}</p>
        </div>
      ) : null}
      <DirectionsButton directionsUrl={directionsUrl} />
    </div>
  )
}
