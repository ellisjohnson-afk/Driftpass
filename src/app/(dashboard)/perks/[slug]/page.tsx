import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getPerkDiscountLabel, getPerkImageUrl } from '@/lib/perks/constants'
import {
  getPartnerCategoryLabel,
  getPartnerDirectionsUrl,
  getPartnerHours,
  getPartnerMapUrl,
  getPartnerOfferHeadline,
  isPartnerOpenNow,
} from '@/lib/partners/detail'
import {
  PartnerHero,
  PartnerMapPreview,
  PartnerOfferCard,
  PartnerOpeningHours,
  PartnerStarRating,
} from '@/components/partner'
import { StatusPill } from '@/components/ui/StatusPill'
import type { PartnerCategory } from '@/types'

export const dynamic = 'force-dynamic'

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4 shrink-0" aria-hidden>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.25" />
    </svg>
  )
}

export default async function PartnerDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: `/perks/${params.slug}` }))

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
    .select(
      'id, name, slug, description, category, address, city, state, lat, lng, google_rating, partner_services(name, service_type, is_active)'
    )
    .eq('slug', params.slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!partner) notFound()

  const category = partner.category as PartnerCategory
  const services = (partner.partner_services ?? []).filter((service) => service.is_active)
  const primaryService = services[0]?.name ?? null
  const discountLabel = getPerkDiscountLabel(partner.slug, category)
  const offerText = getPartnerOfferHeadline(discountLabel, primaryService)
  const imageUrl = getPerkImageUrl(partner.slug, category)
  const categoryLabel = getPartnerCategoryLabel(category)
  const hours = getPartnerHours(partner.slug)
  const isOpen = isPartnerOpenNow(partner.slug)
  const hasMap = partner.lat != null && partner.lng != null

  return (
    <div className="animate-fade-in -mx-4 -mt-6 pb-4">
      <PartnerHero imageUrl={imageUrl} />

      <div className="relative -mt-8 rounded-t-4xl border border-drift-border/60 bg-drift-navy-light px-5 pb-8 pt-6 shadow-drift-card">
        <h1 className="text-2xl font-bold tracking-tight">{partner.name}</h1>

        <p className="mt-2 flex items-center gap-2 text-sm text-drift-text-muted">
          <LocationIcon />
          {partner.city}, {partner.state}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusPill
            label={categoryLabel}
            tone="neutral"
            className="border-drift-gold-to/30 bg-drift-gold-gradient/10 text-drift-gold-mid [&_span]:bg-drift-gold-mid"
          />
          {partner.google_rating ? (
            <PartnerStarRating rating={partner.google_rating} />
          ) : null}
        </div>

        <PartnerOfferCard offerText={offerText} className="mt-5" />

        {partner.description ? (
          <p className="mt-5 text-sm leading-relaxed text-drift-text-muted">{partner.description}</p>
        ) : null}

        <div className="mt-5 space-y-3">
          <PartnerOpeningHours hours={hours} isOpen={isOpen} />
        </div>

        {hasMap ? (
          <div className="mt-4">
            <PartnerMapPreview
              mapEmbedUrl={getPartnerMapUrl(partner.lat!, partner.lng!)}
              directionsUrl={getPartnerDirectionsUrl(partner.lat!, partner.lng!, partner.name)}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-drift-border/60 bg-drift-navy/40 px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-drift-text-muted">Address</p>
            <p className="mt-2 text-sm text-white">{partner.address}</p>
          </div>
        )}

        {services.length > 1 ? (
          <div className="mt-5 border-t border-drift-border/60 pt-5">
            <p className="text-xs uppercase tracking-widest text-drift-text-muted">More member perks</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {services.slice(1).map((service) => (
                <span
                  key={service.service_type}
                  className="rounded-full border border-drift-border bg-drift-navy px-3 py-1.5 text-xs text-white"
                >
                  {service.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
