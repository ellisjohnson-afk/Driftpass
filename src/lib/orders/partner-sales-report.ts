import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderVoucherStatus } from '@/lib/orders/types'

export interface PartnerOrderRow {
  id: string
  product_name: string
  product_slug: string
  amount_aud_cents: number
  partner_payout_cents: number
  platform_fee_cents: number
  status: OrderVoucherStatus
  collected_at: string | null
  created_at: string
  partner: { name: string; slug: string } | null
}

export interface PartnerSalesSummary {
  partnerId: string
  partnerName: string
  partnerSlug: string
  orderCount: number
  collectedCount: number
  grossAudCents: number
  partnerPayoutAudCents: number
  platformFeeAudCents: number
  /** Payout owed — collected orders only */
  payableAudCents: number
}

export async function fetchPartnerOrderRows(options?: {
  status?: OrderVoucherStatus | 'all'
  partnerSlug?: string
  limit?: number
}): Promise<PartnerOrderRow[]> {
  const admin = createAdminClient()
  let query = admin
    .from('order_vouchers')
    .select(
      'id, product_name, product_slug, amount_aud_cents, partner_payout_cents, platform_fee_cents, status, collected_at, created_at, partners(name, slug)'
    )
    .not('partner_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 200)

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let rows = (data ?? []).map((row) => ({
    id: row.id,
    product_name: row.product_name,
    product_slug: row.product_slug,
    amount_aud_cents: row.amount_aud_cents,
    partner_payout_cents: row.partner_payout_cents ?? 0,
    platform_fee_cents: row.platform_fee_cents ?? 0,
    status: row.status as OrderVoucherStatus,
    collected_at: row.collected_at,
    created_at: row.created_at,
    partner: row.partners as { name: string; slug: string } | null,
  }))

  if (options?.partnerSlug) {
    rows = rows.filter((row) => row.partner?.slug === options.partnerSlug)
  }

  return rows
}

export function summarizePartnerSales(rows: PartnerOrderRow[]): PartnerSalesSummary[] {
  const byPartner = new Map<string, PartnerSalesSummary>()

  for (const row of rows) {
    if (!row.partner) continue
    const key = row.partner.slug
    const existing = byPartner.get(key) ?? {
      partnerId: key,
      partnerName: row.partner.name,
      partnerSlug: row.partner.slug,
      orderCount: 0,
      collectedCount: 0,
      grossAudCents: 0,
      partnerPayoutAudCents: 0,
      platformFeeAudCents: 0,
      payableAudCents: 0,
    }

    existing.orderCount += 1
    existing.grossAudCents += row.amount_aud_cents
    existing.partnerPayoutAudCents += row.partner_payout_cents
    existing.platformFeeAudCents += row.platform_fee_cents

    if (row.status === 'collected') {
      existing.collectedCount += 1
      existing.payableAudCents += row.partner_payout_cents
    }

    byPartner.set(key, existing)
  }

  return Array.from(byPartner.values()).sort((a, b) => b.payableAudCents - a.payableAudCents)
}
