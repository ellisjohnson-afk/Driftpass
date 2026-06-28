import { Suspense } from 'react'
import { OrderReceiptActivator } from '@/components/orders/OrderReceiptActivator'

export const dynamic = 'force-dynamic'

export default function TripHelpReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-drift-border/60 bg-drift-navy-light px-6 py-10 text-center text-sm text-drift-text-muted">
          Loading receipt…
        </div>
      }
    >
      <OrderReceiptActivator />
    </Suspense>
  )
}
