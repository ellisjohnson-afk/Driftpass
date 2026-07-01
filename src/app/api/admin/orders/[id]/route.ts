import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { markOrderCollectedById } from '@/lib/orders/fulfillment'

const UpdateSchema = z.object({
  action: z.enum(['mark_collected']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const body = await req.json() as unknown
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
  }

  if (parsed.data.action === 'mark_collected') {
    const result = await markOrderCollectedById(params.id)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ data: result.data })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
