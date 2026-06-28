import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { CollectionReceiptCard } from '@/components/orders'
import { formatDate } from '@/lib/utils/format'
import { fetchUserOrders } from '@/lib/orders/fetch-orders'
import type { OrderVoucher } from '@/lib/orders/types'

export const dynamic = 'force-dynamic'

export default async function TripHelpOrdersPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()

  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: '/trip-help/orders' }))

  const sessionId = searchParams.session_id
  if (sessionId?.startsWith('cs_')) {
    redirect(`/trip-help/receipt?session_id=${encodeURIComponent(sessionId)}`)
  }

  const { data: orders, error } = await fetchUserOrders(supabase, user.id)

  const list = orders

  return (
    <div className="animate-fade-in space-y-6 pb-4">
      <div>
        <Link
          href="/trip-help"
          className="text-sm text-drift-gold-mid hover:text-white"
        >
          ← Trip Help
        </Link>
        <h1 className="mt-3 text-2xl font-bold">My purchases</h1>
        <p className="mt-1 text-sm text-drift-text-muted">
          Paid add-ons with collection PINs for partner pickup
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          Could not load purchases. Refresh the page or try again shortly.
        </div>
      ) : null}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-drift-border/60 bg-drift-navy-light px-6 py-10 text-center">
          <p className="text-sm text-drift-text-muted">No purchases yet.</p>
          <Link
            href="/trip-help"
            className="mt-4 inline-flex rounded-2xl bg-drift-gold-gradient px-5 py-2.5 text-sm font-bold text-drift-navy-deep"
          >
            Browse Trip Help
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((order: OrderVoucher) => {
            const isActive = order.status === 'paid' && order.expires_at > new Date().toISOString()

            return (
              <Link
                key={order.id}
                href={`/trip-help/orders/${order.id}`}
                className="block rounded-2xl border border-drift-border/60 bg-drift-navy-light px-4 py-4 transition-colors hover:border-drift-gold-to/35"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{order.product_name}</p>
                    <p className="mt-1 text-sm text-drift-text-muted">
                      ${(order.amount_aud_cents / 100).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-drift-text-subtle">
                      {order.status === 'collected'
                        ? `Collected ${formatDate(order.collected_at ?? order.updated_at)}`
                        : isActive
                          ? `Valid until ${formatDate(order.expires_at)}`
                          : 'Expired'}
                    </p>
                  </div>
                  <span
                    className={
                      order.status === 'collected'
                        ? 'text-xs font-semibold uppercase text-drift-text-muted'
                        : isActive
                          ? 'text-xs font-semibold uppercase text-drift-gold-mid'
                          : 'text-xs font-semibold uppercase text-red-400'
                    }
                  >
                    {order.status === 'collected' ? 'Done' : isActive ? 'Ready' : order.status}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
