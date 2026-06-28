import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { fulfillOrderFromCheckoutSession } from '@/lib/orders/fulfillment'

const FulfillSchema = z.object({
  sessionId: z.string().startsWith('cs_'),
})

/** POST /api/orders/fulfill — create voucher from completed Stripe checkout */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as unknown
  const parsed = FulfillSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid checkout session' }, { status: 400 })
  }

  try {
    const voucher = await fulfillOrderFromCheckoutSession(parsed.data.sessionId, user.id)

    if (!voucher) {
      return NextResponse.json(
        { error: 'This checkout is not a Trip Help purchase' },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: voucher })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fulfillment failed'
    console.error('[orders/fulfill]', parsed.data.sessionId, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
