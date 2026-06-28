import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OrderVoucherWithPartner } from '@/lib/orders/types'

/** GET /api/orders — list current user's paid/collected vouchers */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status')
  let query = supabase
    .from('order_vouchers')
    .select('*, partners(name, slug, address, city)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (status) {
    query = query.eq('status', status)
  } else {
    query = query.in('status', ['paid', 'collected'])
  }

  const { data, error } = await query

  if (error) {
    if (error.message.includes('order_vouchers')) {
      return NextResponse.json({ data: [] })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: (data ?? []) as OrderVoucherWithPartner[] })
}
