import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { CollectionReceiptCard } from '@/components/orders'
import type { OrderVoucherWithPartner } from '@/lib/orders/types'

export const dynamic = 'force-dynamic'

export default async function TripHelpOrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()

  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: `/trip-help/orders/${params.id}` }))

  const { data: order } = await supabase
    .from('order_vouchers')
    .select('*, partners(name, slug, address, city)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!order) notFound()

  const voucher = order as OrderVoucherWithPartner
  const partner = voucher.partners
  const now = new Date().toISOString()
  const displayStatus =
    voucher.status === 'paid' && voucher.expires_at < now
      ? 'expired'
      : (voucher.status as 'paid' | 'collected' | 'expired')

  return (
    <div className="animate-fade-in space-y-6 pb-4">
      <Link
        href="/trip-help/orders"
        className="text-sm text-drift-gold-mid hover:text-white"
      >
        ← My purchases
      </Link>

      <CollectionReceiptCard
        productName={voucher.product_name}
        partnerName={partner?.name ?? 'Partner'}
        partnerAddress={partner ? `${partner.address}, ${partner.city}` : undefined}
        collectionPin={voucher.collection_pin}
        amountAudCents={voucher.amount_aud_cents}
        expiresAt={voucher.expires_at}
        status={displayStatus === 'expired' ? 'expired' : displayStatus}
      />

      {displayStatus === 'paid' ? (
        <p className="rounded-2xl border border-drift-gold-to/30 bg-drift-gold-gradient/10 px-4 py-3 text-center text-sm text-drift-gold-mid">
          Show this screen at the counter. Staff will enter your collection PIN on their tablet.
        </p>
      ) : null}

      {displayStatus === 'collected' ? (
        <p className="text-center text-sm text-drift-text-muted">
          This order has been collected. Thanks for using DriftPass Trip Help.
        </p>
      ) : null}
    </div>
  )
}
