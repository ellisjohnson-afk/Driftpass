import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchUserOrders } from '@/lib/orders/fetch-orders'

/** GET /api/orders — list current user's paid/collected vouchers */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await fetchUserOrders(supabase, user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
