import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { formatDate } from '@/lib/utils/format'
import { getPerkDiscountLabel, getPerkImageUrl } from '@/lib/perks/constants'
import { MembershipCard } from '@/components/pass/MembershipCard'
import { HomeDealCard } from '@/components/home/HomeDealCard'
import { NoDealsNearbyEmptyState } from '@/components/ui'
import type { PartnerCategory } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: '/home' }))

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status, cancel_at_period_end, current_period_end, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub || !isPassActive(sub.status)) {
    redirect(appUrlAt(appOrigin, '/pricing'))
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, created_at')
    .eq('id', user.id)
    .single()

  const { data: partners } = await admin
    .from('partners')
    .select('id, name, slug, category, city, is_featured')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('is_featured', { ascending: false })
    .limit(4)

  const memberName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Member'
  const memberSince = sub.created_at ? formatDate(sub.created_at) : undefined

  const deals = (partners ?? []).map((partner) => {
    const category = partner.category as PartnerCategory
    return {
      id: partner.id,
      slug: partner.slug,
      name: partner.name,
      city: partner.city,
      discountLabel: getPerkDiscountLabel(partner.slug, category),
      imageUrl: getPerkImageUrl(partner.slug, category),
    }
  })

  return (
    <div className="space-y-6 animate-fade-in pb-2">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-drift-gold-mid">
          Drift Pass
        </p>
      </header>

      <Link
        href="/town/airlie-beach"
        className="block rounded-2xl border border-drift-gold-to/30 bg-drift-gold-gradient/10 px-4 py-4 transition-colors hover:border-drift-gold-to/50"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
          Airlie Beach
        </p>
        <p className="mt-1 text-lg font-bold text-white">Airlie Beach guide</p>
        <p className="mt-1 text-sm text-drift-text-muted">
          Reef highlights, local FAQ, and quick links for your stay
        </p>
      </Link>

      <Link href="/pass" className="block transition-transform hover:scale-[1.01]">
        <MembershipCard
          variant="compact"
          memberName={memberName}
          memberSince={memberSince}
          instruction="Tap to open your pass and PIN"
        />
      </Link>

      {sub.cancel_at_period_end && sub.current_period_end ? (
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-400">
          Your membership ends on {formatDate(sub.current_period_end)}.{' '}
          <Link href="/account" className="underline">
            Manage billing
          </Link>
        </div>
      ) : null}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold">Deals near you</h2>
            <p className="text-sm text-drift-text-muted">Founding partner perks in Airlie Beach</p>
          </div>
          <Link href="/perks" className="text-xs font-semibold text-drift-gold-mid hover:text-white">
            See all
          </Link>
        </div>

        {deals.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {deals.map((deal) => (
              <HomeDealCard key={deal.id} {...deal} />
            ))}
          </div>
        ) : (
          <NoDealsNearbyEmptyState />
        )}
      </section>

      <Link
        href="/pass"
        className="flex w-full items-center justify-center rounded-2xl bg-drift-gold-gradient px-6 py-4 text-center text-base font-bold uppercase tracking-wide text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
      >
        Show my pass
      </Link>
    </div>
  )
}
