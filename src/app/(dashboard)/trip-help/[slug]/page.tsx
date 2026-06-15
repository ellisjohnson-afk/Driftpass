import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getTripUtility } from '@/lib/trip-help/constants'
import { UtilityDetailContent } from '@/components/trip-help'

export const dynamic = 'force-dynamic'

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

  const { data: partner } = await admin
    .from('partners')
    .select('name, slug, address, city, partner_services(service_type, is_active)')
    .eq('slug', utility.partnerSlug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

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
    />
  )
}
