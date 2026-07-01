import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { activateFreeMembership } from '@/lib/subscriptions/free-membership'

const UpdateSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('activate_membership'),
  }),
  z.object({
    action: z.literal('set_admin'),
    is_admin: z.boolean(),
  }),
])

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

  if (parsed.data.action === 'activate_membership') {
    try {
      const result = await activateFreeMembership(params.id)
      return NextResponse.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Activation failed'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  if (parsed.data.action === 'set_admin') {
    if (params.id === auth.user!.id && !parsed.data.is_admin) {
      return NextResponse.json({ error: 'You cannot remove your own admin access' }, { status: 400 })
    }

    const { data, error } = await auth.admin!
      .from('profiles')
      .update({ is_admin: parsed.data.is_admin })
      .eq('id', params.id)
      .select('id, is_admin')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
