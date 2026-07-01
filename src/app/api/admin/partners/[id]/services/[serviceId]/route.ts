import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { AdminPartnerServiceUpdateSchema } from '@/lib/partners/admin-service-schema'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const body = await req.json() as unknown
  const parsed = AdminPartnerServiceUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid service update' }, { status: 400 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await auth.admin!
    .from('partner_services')
    .update(parsed.data)
    .eq('id', params.serviceId)
    .eq('partner_id', params.id)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This service type already exists for the partner' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { error } = await auth.admin!
    .from('partner_services')
    .delete()
    .eq('id', params.serviceId)
    .eq('partner_id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { deleted: true } })
}
