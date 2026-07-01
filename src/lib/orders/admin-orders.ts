import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderProductType, OrderVoucherStatus } from '@/lib/orders/types'

export interface AdminOrderRow {
  id: string
  product_type: OrderProductType
  product_name: string
  product_slug: string
  amount_aud_cents: number
  partner_payout_cents: number
  platform_fee_cents: number
  collection_pin: string
  status: OrderVoucherStatus
  stripe_checkout_session_id: string | null
  expires_at: string
  collected_at: string | null
  created_at: string
  partner: { name: string; slug: string } | null
  member: { email: string; full_name: string | null } | null
}

export async function fetchAdminOrderRows(options?: {
  status?: OrderVoucherStatus | 'all'
  partnerSlug?: string
  productType?: OrderProductType | 'all'
  limit?: number
}): Promise<AdminOrderRow[]> {
  const admin = createAdminClient()
  let query = admin
    .from('order_vouchers')
    .select(
      `id, product_type, product_name, product_slug, amount_aud_cents, partner_payout_cents,
       platform_fee_cents, collection_pin, status, stripe_checkout_session_id, expires_at,
       collected_at, created_at, partners(name, slug), profiles(email, full_name)`
    )
    .not('partner_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 300)

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  if (options?.productType && options.productType !== 'all') {
    query = query.eq('product_type', options.productType)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let rows = (data ?? []).map((row) => ({
    id: row.id,
    product_type: row.product_type as OrderProductType,
    product_name: row.product_name,
    product_slug: row.product_slug,
    amount_aud_cents: row.amount_aud_cents,
    partner_payout_cents: row.partner_payout_cents ?? 0,
    platform_fee_cents: row.platform_fee_cents ?? 0,
    collection_pin: row.collection_pin,
    status: row.status as OrderVoucherStatus,
    stripe_checkout_session_id: row.stripe_checkout_session_id,
    expires_at: row.expires_at,
    collected_at: row.collected_at,
    created_at: row.created_at,
    partner: row.partners as { name: string; slug: string } | null,
    member: row.profiles as { email: string; full_name: string | null } | null,
  }))

  if (options?.partnerSlug) {
    rows = rows.filter((row) => row.partner?.slug === options.partnerSlug)
  }

  return rows
}
