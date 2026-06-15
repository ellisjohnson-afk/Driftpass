import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getPerkDiscountLabel, getPerkImageUrl } from '@/lib/perks/constants'
import type { PartnerCategory } from '@/types'

export const dynamic = 'force-dynamic'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
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

  const { data: partner } = await supabase
    .from('partners')
    .select(
      'id, name, slug, description, category, address, city, state, google_rating, partner_services(name, service_type, is_active)'
    )
    .eq('slug', params.slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!partner) notFound()

  const category = partner.category as PartnerCategory
  const services = (partner.partner_services ?? []).filter((service) => service.is_active)
  const discountLabel = getPerkDiscountLabel(partner.slug, category)
  const imageUrl = getPerkImageUrl(partner.slug, category)

  return (
    <div className="animate-fade-in -mx-4 -mt-6">
      <div className="relative h-56 w-full">
        <Image src={imageUrl} alt="" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-drift-navy-deep via-transparent to-black/30" />

        <Link
          href="/perks"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          aria-label="Back to perks"
        >
          <BackIcon />
        </Link>
      </div>

      <div className="relative -mt-6 rounded-t-4xl border border-drift-border/60 bg-drift-navy-light px-5 pb-8 pt-6">
        <h1 className="text-2xl font-bold">{partner.name}</h1>
        <p className="mt-1 text-sm text-drift-text-muted">
          {partner.city}, {partner.state}
        </p>

        <div className="mt-4 rounded-2xl border border-drift-gold-to/30 bg-drift-gold-gradient/15 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-drift-gold-mid">Member offer</p>
              <p className="mt-1 text-lg font-bold text-white">{discountLabel}</p>
            </div>
            <Link
              href="/pass"
              className="shrink-0 rounded-xl bg-drift-gold-gradient px-4 py-2.5 text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
            >
              Show pass
            </Link>
          </div>
        </div>

        {partner.description ? (
          <p className="mt-5 text-sm leading-relaxed text-drift-text-muted">{partner.description}</p>
        ) : null}

        <div className="mt-5 space-y-3 border-t border-drift-border/60 pt-5">
          <p className="text-xs uppercase tracking-widest text-drift-text-muted">Location</p>
          <p className="text-sm text-white">{partner.address}</p>
          {partner.google_rating ? (
            <p className="text-sm text-drift-text-muted">⭐ {partner.google_rating} on Google</p>
          ) : null}
        </div>

        {services.length > 0 ? (
          <div className="mt-5 space-y-3 border-t border-drift-border/60 pt-5">
            <p className="text-xs uppercase tracking-widest text-drift-text-muted">Available perks</p>
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
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
