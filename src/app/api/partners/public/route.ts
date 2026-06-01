import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/partners/public — no auth required
// ?partnerId=xxx → returns services for that partner
// no params → returns all active partners list

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const partnerId = req.nextUrl.searchParams.get('partnerId')

  if (partnerId) {
    const { data: services } = await admin
      .from('partner_services')
      .select('id, name, credit_cost, service_type')
      .eq('partner_id', partnerId)
      .eq('is_active', true)
      .order('credit_cost', { ascending: true })

    return NextResponse.json({ services: services ?? [] })
  }

  const { data: partners } = await admin
    .from('partners')
    .select('id, name, category')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return NextResponse.json(partners ?? [])
}
