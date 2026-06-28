import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { OrderVoucher, OrderVoucherWithPartner } from '@/lib/orders/types'

type Client = SupabaseClient<Database>

export async function fetchUserOrders(
  supabase: Client,
  userId: string
): Promise<{ data: OrderVoucher[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('order_vouchers')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['paid', 'collected', 'expired'])
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return { data: [], error: new Error(error.message) }
  return { data: (data ?? []) as OrderVoucher[], error: null }
}

export async function fetchUserOrderById(
  supabase: Client,
  userId: string,
  orderId: string
): Promise<OrderVoucherWithPartner | null> {
  const { data: order, error } = await supabase
    .from('order_vouchers')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !order) return null

  let partners: OrderVoucherWithPartner['partners'] = null
  if (order.partner_id) {
    const { data: partner } = await supabase
      .from('partners')
      .select('name, slug, address, city')
      .eq('id', order.partner_id)
      .maybeSingle()
    partners = partner
  }

  return { ...(order as OrderVoucher), partners }
}
