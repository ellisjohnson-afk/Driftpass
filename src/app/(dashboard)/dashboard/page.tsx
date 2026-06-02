import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getCreditBalance } from '@/lib/credits/engine'
import { formatAUD, formatDate, creditPercentage } from '@/lib/utils/format'
import type { Partner } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Subscription status — use admin client to bypass RLS
  const admin = createAdminClient()
  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .select('id, status, cancel_at_period_end, current_period_end, plans(name, credits_per_month)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub || sub.status !== 'active') {
    redirect('/pricing')
  }

  // Credit balance
  const balance = await getCreditBalance(user.id)

  // Recent partners (all, for now — geo filter in Phase 2)
  const { data: partners } = await supabase
    .from('partners')
    .select('id, name, category, city, address, google_rating, logo_url, partner_services(credit_cost, name, service_type, is_active)')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('is_featured', { ascending: false })
    .limit(6)

  // Recent redemptions
  const { data: redemptions } = await supabase
    .from('redemptions')
    .select('id, credits_used, created_at, partners(name), partner_services(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const planName = (sub?.plans as { name?: string } | null)?.name ?? 'DriftPass'
  const pct = creditPercentage(balance.used_credits, balance.total_credits)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Credit Balance Card */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">{planName} Plan</div>
            <div className="text-4xl font-bold text-[#00FF7F]">
              {balance.remaining_credits}
              <span className="text-lg text-[#6B7280] font-normal"> credits left</span>
            </div>
          </div>
          <Link
            href="/pass"
            className="bg-[#00FF7F] text-[#0A0A0A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00E070] transition-colors"
          >
            My Pass
          </Link>
        </div>

        {/* Credit bar */}
        <div className="bg-[#2A2A2A] rounded-full h-2 mb-2">
          <div
            className="bg-[#00FF7F] rounded-full h-2 credit-bar transition-all"
            style={{ width: `${100 - pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#6B7280]">
          <span>{balance.used_credits} used</span>
          <span>Resets {formatDate(balance.period_end)}</span>
        </div>

        {sub?.cancel_at_period_end && (
          <div className="mt-4 bg-yellow-900/20 border border-yellow-800 rounded-lg px-4 py-2 text-sm text-yellow-400">
            Your subscription will cancel on {formatDate(balance.period_end)}.{' '}
            <Link href="/account" className="underline">Reactivate</Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: '🎫', label: 'My Pass', href: '/pass' },
          { emoji: '⚡', label: 'Flash Deals', href: '/flash' },
          { emoji: '🗺️', label: 'Route Map', href: '/map' },
        ].map(({ emoji, label, href }) => (
          <Link
            key={href}
            href={href}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center hover:border-[#00FF7F]/50 transition-colors"
          >
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-xs text-[#9CA3AF]">{label}</div>
          </Link>
        ))}
      </div>

      {/* Nearby Partners */}
      <section>
        <h2 className="font-semibold mb-3 flex items-center justify-between">
          Partners near you
          <span className="text-xs text-[#6B7280]">Airlie Beach</span>
        </h2>
        <div className="space-y-3">
          {(partners ?? []).map((p) => (
            <PartnerCard key={p.id} partner={p as unknown as Partner} />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      {redemptions && redemptions.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Recent activity</h2>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl divide-y divide-[#2A2A2A]">
            {redemptions.map((r) => {
              const partner = r.partners as { name?: string } | null
              const service = r.partner_services as { name?: string } | null
              return (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{service?.name}</div>
                    <div className="text-xs text-[#6B7280]">{partner?.name}</div>
                  </div>
                  <div className="text-sm text-[#FF6B35] font-medium">
                    -{r.credits_used} cr
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
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
  const minCredits = services.length > 0
    ? Math.min(...services.map((s) => s.credit_cost))
    : null

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 partner-card">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#2A2A2A] rounded-lg flex items-center justify-center text-xl flex-shrink-0">
          {CATEGORY_EMOJI[partner.category] ?? '📍'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-sm">{partner.name}</div>
              <div className="text-xs text-[#6B7280]">{partner.address}</div>
            </div>
            {partner.google_rating && (
              <div className="text-xs text-[#9CA3AF] flex-shrink-0">
                ⭐ {partner.google_rating}
              </div>
            )}
          </div>

          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {services.slice(0, 3).map((s) => (
                <span
                  key={s.id}
                  className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-full px-2.5 py-0.5 text-xs text-[#9CA3AF]"
                >
                  {s.name} · {s.credit_cost}cr
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
