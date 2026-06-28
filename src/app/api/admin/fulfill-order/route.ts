import { NextRequest, NextResponse } from 'next/server'
import { fulfillOrderFromCheckoutSession } from '@/lib/orders/fulfillment'

/** POST /api/admin/fulfill-order — recover a paid checkout (ADMIN_SECRET only) */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as { sessionId?: string }
  if (!body.sessionId?.startsWith('cs_')) {
    return NextResponse.json({ error: 'sessionId required (cs_...)' }, { status: 400 })
  }

  try {
    const voucher = await fulfillOrderFromCheckoutSession(body.sessionId)
    if (!voucher) {
      return NextResponse.json({ error: 'Not a voucher checkout session' }, { status: 400 })
    }
    return NextResponse.json({ data: voucher })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fulfillment failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
