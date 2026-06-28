import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchUserOrderById } from '@/lib/orders/fetch-orders'

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

  const data = await fetchUserOrderById(supabase, user.id, params.id)

  if (!data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
}
