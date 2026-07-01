import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { fulfillOrderFromCheckoutSession } from '@/lib/orders/fulfillment'

const FulfillSchema = z.object({
  sessionId: z.string().startsWith('cs_'),
})

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const body = await req.json() as unknown
  const parsed = FulfillSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'sessionId required (cs_...)' }, { status: 400 })
  }

  try {
    const voucher = await fulfillOrderFromCheckoutSession(parsed.data.sessionId)
    if (!voucher) {
      return NextResponse.json({ error: 'Not a voucher checkout session' }, { status: 400 })
    }
    return NextResponse.json({ data: voucher })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fulfillment failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
