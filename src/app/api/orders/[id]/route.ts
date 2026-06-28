import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OrderVoucherWithPartner } from '@/lib/orders/types'

/** GET /api/orders/[id] — single order receipt */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('order_vouchers')
    .select('*, partners(name, slug, address, city)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ data: data as OrderVoucherWithPartner })
}
