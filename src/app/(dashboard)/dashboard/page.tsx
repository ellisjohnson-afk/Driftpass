import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { formatDate } from '@/lib/utils/format'
import { MembershipCard } from '@/components/pass/MembershipCard'
import type { Partner } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: '/dashboard' }))

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, status, cancel_at_period_end, current_period_end, created_at')
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

  const { data: partners } = await supabase
    .from('partners')
    .select('id, name, category, city, address, google_rating, logo_url, partner_services(name, service_type, is_active)')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('is_featured', { ascending: false })
    .limit(6)

  const memberName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Member'
  const memberSince = sub.created_at ? formatDate(sub.created_at) : undefined

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <p className="text-xs uppercase tracking-widest text-drift-teal">Explore</p>
        <h1 className="mt-1 text-xl font-bold">Discover partners near you</h1>
        <p className="mt-1 text-sm text-drift-text-muted">
          Member discounts and local perks — show your pass at checkout.
        </p>
      </header>

      <Link href="/pass" className="block transition-transform hover:scale-[1.01]">
        <MembershipCard
          variant="compact"
          memberName={memberName}
          memberSince={memberSince}
          instruction="Tap to open your pass and PIN"
        />
      </Link>

      {sub.cancel_at_period_end && (
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-400">
          Your membership ends on {formatDate(sub.current_period_end)}.{' '}
          <Link href="/account" className="underline">Manage billing</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/pass"
          className="rounded-xl border border-drift-border bg-drift-navy-light p-4 text-center transition-colors hover:border-drift-teal/50"
        >
          <div className="text-2xl mb-1">🎫</div>
          <div className="text-xs text-drift-text-muted">My Pass</div>
        </Link>
        <Link
          href="/account"
          className="rounded-xl border border-drift-border bg-drift-navy-light p-4 text-center transition-colors hover:border-drift-teal/50"
        >
          <div className="text-2xl mb-1">⚙️</div>
          <div className="text-xs text-drift-text-muted">Account</div>
        </Link>
      </div>

      <section>
        <h2 className="mb-3 flex items-center justify-between font-semibold">
          Partners near you
          <span className="text-xs font-normal text-drift-text-muted">Airlie Beach</span>
        </h2>

        {(partners ?? []).length > 0 ? (
          <div className="space-y-3">
            {(partners ?? []).map((p) => (
              <PartnerCard key={p.id} partner={p as unknown as Partner} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-drift-border bg-drift-navy-light px-4 py-8 text-center text-sm text-drift-text-muted">
            More partners coming soon across Australia.
          </div>
        )}
      </section>

      <p className="pb-2 text-center text-xs text-drift-text-muted">
        Full explore experience coming in the next design update.
      </p>
    </div>
  )
}

const CATEGORY_EMOJI: Record<string, string> = {
  gym_fitness: '🏋️',
  cafe_cowork: '☕',
  laundry: '🧺',
  luggage_storage: '🎒',
  shower: '🚿',
  scooter_hire: '🛵',
  water_fill: '💧',
  restaurant: '🍽️',
  mechanic: '🔧',
  kitchen: '🍳',
  ev_charging: '⚡',
  other: '📍',
}

function PartnerCard({ partner }: { partner: Partner }) {
  const services = (partner.services ?? []).filter((s) => s.is_active)

  return (
    <div className="rounded-xl border border-drift-border bg-drift-navy-light p-4 partner-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-drift-navy text-xl">
          {CATEGORY_EMOJI[partner.category] ?? '📍'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">{partner.name}</div>
              <div className="text-xs text-drift-text-muted">{partner.address}</div>
            </div>
            {partner.google_rating && (
              <div className="flex-shrink-0 text-xs text-drift-text-muted">
                ⭐ {partner.google_rating}
              </div>
            )}
          </div>

          {services.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {services.slice(0, 3).map((s) => (
                <span
                  key={s.id}
                  className="rounded-full border border-drift-border bg-drift-navy px-2.5 py-0.5 text-xs text-drift-text-muted"
                >
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
