import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getPerkDiscountLabel, getPerkImageUrl } from '@/lib/perks/constants'
import { PerksExplorer, type PerkListItem } from '@/components/perks'
import type { PartnerCategory } from '@/types'

export const dynamic = 'force-dynamic'

export default async function PerksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: '/perks' }))

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

  const { data: partners } = await supabase
    .from('partners')
    .select(
      'id, name, slug, category, city, is_featured, partner_services(service_type, is_active)'
    )
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true })

  const perks: PerkListItem[] = (partners ?? []).map((partner) => {
    const category = partner.category as PartnerCategory
    const serviceTypes = (partner.partner_services ?? [])
      .filter((service) => service.is_active)
      .map((service) => service.service_type)

    return {
      id: partner.id,
      name: partner.name,
      slug: partner.slug,
      city: partner.city,
      category,
      discountLabel: getPerkDiscountLabel(partner.slug, category),
      imageUrl: getPerkImageUrl(partner.slug, category),
      serviceTypes,
    }
  })

  return <PerksExplorer perks={perks} />
}
