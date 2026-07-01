import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { AdminPartnerServiceSchema } from '@/lib/partners/admin-service-schema'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { data, error } = await auth.admin!
    .from('partner_services')
    .select('*')
    .eq('partner_id', params.id)
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const body = await req.json() as unknown
  const parsed = AdminPartnerServiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 })
  }

  const { data: partner } = await auth.admin!
    .from('partners')
    .select('id')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  const { data, error } = await auth.admin!
    .from('partner_services')
    .insert({
      partner_id: params.id,
      ...parsed.data,
      max_daily_redemptions: parsed.data.max_daily_redemptions ?? null,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This service type already exists for the partner' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
