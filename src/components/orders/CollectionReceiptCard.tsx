import { cn } from '@/lib/utils/cn'
import { formatCollectionPin } from '@/lib/orders/collection-pin'
import { formatDate } from '@/lib/utils/format'

export interface CollectionReceiptCardProps {
  productName: string
  partnerName: string
  partnerAddress?: string
  collectionPin: string
  amountAudCents: number
  expiresAt: string
  status: 'paid' | 'collected' | 'expired'
  className?: string
}

function PinDigit({ digit }: { digit: string }) {
  return (
    <div className="flex h-12 w-11 items-center justify-center rounded-2xl bg-drift-navy-deep/15 text-xl font-bold text-drift-navy-deep shadow-inner sm:h-14 sm:w-12 sm:text-2xl">
      {digit}
    </div>
  )
}

export function CollectionReceiptCard({
  productName,
  partnerName,
  partnerAddress,
  collectionPin,
  amountAudCents,
  expiresAt,
  status,
  className,
}: CollectionReceiptCardProps) {
  const digits = formatCollectionPin(collectionPin).replace(' ', '').padEnd(6, '·').split('')

  return (
    <div
      className={cn(
        'rounded-4xl bg-drift-gold-gradient p-6 text-drift-navy-deep shadow-drift-card',
        className
      )}
    >
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-drift-navy-deep/65">
        Collection receipt
      </p>
      <h2 className="mt-3 text-center text-2xl font-bold">{productName}</h2>
      <p className="mt-1 text-center text-sm text-drift-navy-deep/75">{partnerName}</p>
      {partnerAddress ? (
        <p className="mt-1 text-center text-xs text-drift-navy-deep/60">{partnerAddress}</p>
      ) : null}

      <div className="mt-6 flex justify-center gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <PinDigit key={`${index}-${digit}`} digit={digit} />
        ))}
      </div>

      <p className="mt-5 text-center text-sm font-semibold">
        Show this PIN at the counter
      </p>

      <div className="mt-5 space-y-2 rounded-2xl border border-drift-navy-deep/10 bg-drift-navy-deep/5 px-4 py-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-drift-navy-deep/70">Paid</span>
          <span className="font-bold">${(amountAudCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-drift-navy-deep/70">Valid until</span>
          <span className="font-medium">{formatDate(expiresAt)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-drift-navy-deep/70">Status</span>
          <span className="font-semibold capitalize">{status}</span>
        </div>
      </div>
    </div>
  )
}
