import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database.types'

type PartnerUpdate = Database['public']['Tables']['partners']['Update']

// GET /api/partners/[id] — public
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partners')
    .select(`
      *,
      partner_services(*)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

// PATCH /api/partners/[id] — admin or partner owner
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if admin or partner owner
  const adminSecret = req.headers.get('x-admin-secret')
  const isAdmin = adminSecret === process.env.ADMIN_SECRET

  if (!isAdmin) {
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('partner_id', id)
      .single()

    if (!partnerUser || partnerUser.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await req.json() as Record<string, unknown>

  // Only allow safe fields to be updated
  const allowedFields = ['name', 'description', 'phone', 'email', 'website', 'logo_url', 'is_active']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowedFields.includes(k))
  )

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('partners')
    .update(updates as PartnerUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
