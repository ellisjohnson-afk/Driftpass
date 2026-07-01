import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { AdminPartnerSchema } from '@/lib/partners/admin-schema'
import { fetchAllPartnersForAdmin } from '@/lib/partners/admin-fetch'

export async function GET() {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  try {
    const rows = await fetchAllPartnersForAdmin(auth.admin!)
    return NextResponse.json({ data: rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load partners'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const body = await req.json() as unknown
  const parsed = AdminPartnerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid partner' }, { status: 400 })
  }

  const { data, error } = await auth.admin!
    .from('partners')
    .insert(parsed.data)
    .select('*, partner_services(id, name, is_active)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
