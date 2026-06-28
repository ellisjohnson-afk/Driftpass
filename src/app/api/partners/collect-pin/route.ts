import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { collectOrderByPin } from '@/lib/orders/fulfillment'

const CollectSchema = z.object({
  pin: z.string().min(6).max(7),
})

/** POST /api/partners/collect-pin — mark a paid order as collected */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as unknown
  const parsed = CollectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a 6-digit collection PIN' }, { status: 400 })
  }

  const result = await collectOrderByPin(parsed.data.pin)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result.data)
}
