import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { buildPartnerOnboardingChecklist } from '@/lib/partners/onboarding-status'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { data: partner, error } = await auth.admin!
    .from('partners')
    .select('slug, name, address, is_active, is_verified, partner_services(is_active, aud_payout_cents)')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  const checklist = buildPartnerOnboardingChecklist({
    slug: partner.slug,
    name: partner.name,
    address: partner.address,
    is_active: partner.is_active,
    is_verified: partner.is_verified,
    partner_services: partner.partner_services ?? [],
  })

  return NextResponse.json({ data: checklist })
}
