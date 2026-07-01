import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getPurchasableMarketplaceProduct } from '@/lib/orders/catalog'
import {
  fetchActiveTripHelpProducts,
  fetchTripHelpProductBySlug,
} from '@/lib/trip-help/fetch-products'
import { toTripHelpProductDisplay } from '@/lib/trip-help/product-types'
import { ProductPurchaseButton } from '@/components/orders'
import { TripHelpLocationCard, TripToursHub } from '@/components/trip-help'
import {
  formatPartnerAddress,
  resolvePartnerDirectionsUrl,
  resolvePartnerOpeningHours,
} from '@/lib/partners/detail'
import { fetchPartnerBySlug } from '@/lib/partners/fetch'
import { EXPLORE_EXCLUDED_PARTNER_SLUGS } from '@/lib/perks/constants'

export const dynamic = 'force-dynamic'

type MarketplacePartnerRow = {
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
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-drift-gold-mid" aria-hidden>
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

async function requireActiveMember(nextPath: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: nextPath }))

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

  return admin
}

export default async function MarketplacePurchasePage({
  params,
}: {
  params: { slug: string }
}) {
  if (params.slug === 'tours-experiences') {
    const admin = await requireActiveMember('/trip-help/marketplace/tours-experiences')
    let tours: Awaited<ReturnType<typeof fetchActiveTripHelpProducts>> = []
    try {
      tours = await fetchActiveTripHelpProducts(admin, { hubSlug: 'tours-experiences' })
    } catch {
      // Migration 018 may not be applied yet
    }
    return <TripToursHub tours={tours} />
  }

  const admin = await requireActiveMember(`/trip-help/marketplace/${params.slug}`)
  const productRow = await fetchTripHelpProductBySlug(admin, params.slug)
  if (!productRow || productRow.section !== 'marketplace') notFound()

  const display = toTripHelpProductDisplay(productRow)
  const checkoutProduct = await getPurchasableMarketplaceProduct(admin, params.slug)
  if (!checkoutProduct || !display.isPurchasable) notFound()

  const { data: partner } = await fetchPartnerBySlug<MarketplacePartnerRow>(
    admin,
    display.partnerSlug,
    'name, slug, address, city, state, lat, lng, google_place_id, opening_hours, timezone'
  )

  const hours = partner
    ? resolvePartnerOpeningHours(partner.slug, partner.opening_hours, partner.timezone)
    : null

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

  const isTour = Boolean(display.hubSlug)
  const serviceLabel = isTour ? 'Check in with' : 'Redeem this offer at'
  const backHref = isTour ? '/trip-help/marketplace/tours-experiences' : '/trip-help'

  return (
    <div className="animate-fade-in -mx-4 -mt-6 pb-4">
      <div className="bg-drift-navy-deep px-5 pb-10 pt-5">
        <Link
          href={backHref}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Go back"
        >
          <BackIcon />
        </Link>

        <span className="text-3xl" aria-hidden>
          {display.emoji ?? '✨'}
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
          {isTour ? 'Trip Help · Tours' : 'Trip Help Marketplace'}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{display.label}</h1>
        <p className="mt-2 text-sm text-drift-text-muted">{display.tagline ?? display.description}</p>
        <p className="mt-3 text-sm text-drift-text-muted">
          with{' '}
          <span className="font-semibold text-white">
            {partner?.name ?? display.partnerDisplayName}
          </span>
        </p>
      </div>

      <div className="relative -mt-6 rounded-t-4xl border border-drift-border/60 bg-drift-navy-light px-5 pb-8 pt-6">
        <p className="text-3xl font-bold text-white">
          {display.priceLabel}
          {display.priceSubtext ? (
            <span className="ml-2 text-sm font-normal text-drift-text-muted">{display.priceSubtext}</span>
          ) : null}
        </p>

        <TripHelpLocationCard
          partnerName={partner?.name ?? display.partnerDisplayName}
          partnerAddress={partnerAddress}
          partnerHref={partnerHref}
          serviceLabel={serviceLabel}
          hoursSummary={hours?.summary ?? display.hoursLabel ?? undefined}
          isOpen={hours?.isOpen}
          directionsUrl={directionsUrl}
          lat={partner?.lat}
          lng={partner?.lng}
          className="mt-5"
        />

        <p className="mt-5 text-sm leading-relaxed text-drift-text-muted">{display.description}</p>

        {display.meetingNote ? (
          <p className="mt-3 rounded-xl border border-drift-gold-to/20 bg-drift-gold-gradient/10 px-4 py-3 text-sm text-drift-gold-mid">
            {display.meetingNote}
          </p>
        ) : null}

        {display.features.length ? (
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {display.features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-xl border border-drift-border/50 bg-drift-navy/40 px-3 py-2.5 text-sm text-white"
              >
                <CheckIcon />
                {feature}
              </div>
            ))}
          </div>
        ) : null}

        <ProductPurchaseButton
          productType="marketplace"
          productSlug={display.slug}
          priceLabel={display.priceLabel}
          className="mt-6"
        />
      </div>
    </div>
  )
}
