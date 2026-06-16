import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getTripUtility } from '@/lib/trip-help/constants'
import { resolvePartnerOpeningHours } from '@/lib/partners/detail'
import { fetchPartnerBySlug } from '@/lib/partners/fetch'
import { UtilityDetailContent } from '@/components/trip-help'

export const dynamic = 'force-dynamic'

type TripHelpPartnerRow = {
  name: string
  slug: string
  address: string
  city: string
  partner_services: Array<{ service_type: string; is_active: boolean }> | null
}

export default async function UtilityDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const utility = getTripUtility(params.slug)
  if (!utility) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: `/trip-help/${params.slug}` }))

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub || !isPassActive(sub.status)) {
    redirect(appUrlAt(appOrigin, '/pricing'))
  }

  const { data: partner } = await fetchPartnerBySlug<TripHelpPartnerRow>(
    admin,
    utility.partnerSlug,
    'name, slug, address, city, partner_services(service_type, is_active)'
  )

  const hours = partner
    ? resolvePartnerOpeningHours(partner.slug, partner.opening_hours, partner.timezone)
    : null

  const hasService =
    utility.slug === 'transfers' ||
    (partner?.partner_services ?? []).some(
      (service) => service.service_type === utility.serviceType && service.is_active
    )

  return (
    <UtilityDetailContent
      utility={utility}
      partnerName={partner?.name ?? 'DriftPass Partner'}
      partnerAddress={
        partner ? `${partner.address}, ${partner.city}` : 'Airlie Beach, QLD'
      }
      partnerHref={partner ? `/perks/${partner.slug}` : '/perks'}
      isAvailable={Boolean(partner && hasService)}
      hoursSummary={hours?.summary}
      isOpen={hours?.isOpen}
    />
  )
}
