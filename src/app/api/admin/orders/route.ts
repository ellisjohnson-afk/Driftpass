import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { fetchAdminOrderRows } from '@/lib/orders/admin-orders'
import { summarizePartnerSales } from '@/lib/orders/partner-sales-report'
import type { OrderProductType, OrderVoucherStatus } from '@/lib/orders/types'

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const status = (searchParams.get('status') ?? 'all') as OrderVoucherStatus | 'all'
  const partnerSlug = searchParams.get('partner') ?? undefined
  const productType = (searchParams.get('productType') ?? 'all') as OrderProductType | 'all'

  try {
    const orders = await fetchAdminOrderRows({
      status,
      partnerSlug,
      productType,
    })
    const summaries = summarizePartnerSales(
      orders.map((order) => ({
        id: order.id,
        product_name: order.product_name,
        product_slug: order.product_slug,
        amount_aud_cents: order.amount_aud_cents,
        partner_payout_cents: order.partner_payout_cents,
        platform_fee_cents: order.platform_fee_cents,
        status: order.status,
        collected_at: order.collected_at,
        created_at: order.created_at,
        partner: order.partner,
      }))
    )

    return NextResponse.json({ data: { orders, summaries } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load orders'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
