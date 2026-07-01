import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getPurchasableTripHelpProduct } from '@/lib/orders/catalog'
import {
  fetchTripHelpProductBySlug,
} from '@/lib/trip-help/fetch-products'
import { toTripHelpProductDisplay } from '@/lib/trip-help/product-types'
import {
  formatPartnerAddress,
  resolvePartnerDirectionsUrl,
  resolvePartnerOpeningHours,
} from '@/lib/partners/detail'
import { fetchPartnerBySlug } from '@/lib/partners/fetch'
import { EXPLORE_EXCLUDED_PARTNER_SLUGS } from '@/lib/perks/constants'
import { UtilityDetailContent } from '@/components/trip-help'

export const dynamic = 'force-dynamic'

type TripHelpPartnerRow = {
  name: string
  slug: string
  address: string
  city: string
  state: string
  lat: number | null
  lng: number | null
  google_place_id: string | null
  opening_hours: unknown
  timezone: string | null
  partner_services: Array<{ service_type: string; is_active: boolean }> | null
}

export default async function UtilityDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const admin = createAdminClient()
  const productRow = await fetchTripHelpProductBySlug(admin, params.slug)
  if (!productRow || productRow.section !== 'utilities') notFound()

  const utility = toTripHelpProductDisplay(productRow)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: `/trip-help/${params.slug}` }))

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

  const partnerSlug = utility.partnerSlug
  const { data: partner } = partnerSlug
    ? await fetchPartnerBySlug<TripHelpPartnerRow>(
        admin,
        partnerSlug,
        'name, slug, address, city, state, lat, lng, google_place_id, opening_hours, timezone, partner_services(service_type, is_active)'
      )
    : { data: null }

  const hours = partner
    ? resolvePartnerOpeningHours(partner.slug, partner.opening_hours, partner.timezone)
    : null

  const hasService =
    !utility.isPurchasable ||
    (partner?.partner_services ?? []).some(
      (service) =>
        utility.serviceType != null &&
        service.service_type === utility.serviceType &&
        service.is_active
    )

  const checkoutProduct = await getPurchasableTripHelpProduct(admin, utility.slug)
  const purchasable = Boolean(checkoutProduct && partner && hasService && utility.isPurchasable)

  const partnerAddress = partner ? formatPartnerAddress(partner) : 'Airlie Beach, QLD'

  const directionsUrl = partner
    ? resolvePartnerDirectionsUrl({
        name: partner.name,
        address: partner.address,
        city: partner.city,
        state: partner.state,
        lat: partner.lat,
        lng: partner.lng,
        google_place_id: partner.google_place_id,
      })
    : undefined

  const partnerHref =
    partner && !EXPLORE_EXCLUDED_PARTNER_SLUGS.has(partner.slug)
      ? `/perks/${partner.slug}`
      : undefined

  return (
    <UtilityDetailContent
      utility={utility}
      partnerName={partner?.name ?? utility.partnerDisplayName}
      partnerAddress={partnerAddress}
      partnerHref={partnerHref}
      isAvailable={Boolean(partner && (utility.isPurchasable ? hasService : true))}
      hoursSummary={hours?.summary}
      isOpen={hours?.isOpen}
      purchasable={purchasable}
      directionsUrl={directionsUrl}
      partnerLat={partner?.lat}
      partnerLng={partner?.lng}
    />
  )
}
