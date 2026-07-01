import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { AdminTripHelpProductSchema } from '@/lib/trip-help/admin-product-schema'
import { fetchAllTripHelpProductsForAdmin } from '@/lib/trip-help/fetch-products'

export async function GET() {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  try {
    const rows = await fetchAllTripHelpProductsForAdmin(auth.admin!)
    return NextResponse.json({ data: rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const body = await req.json() as unknown
  const parsed = AdminTripHelpProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
  }

  const { data, error } = await auth.admin!
    .from('trip_help_products')
    .insert(parsed.data)
    .select('*, partners(id, name, slug)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
