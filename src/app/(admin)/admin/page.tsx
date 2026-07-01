import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatAUD, formatDate } from '@/lib/utils/format'
import { fetchPartnerOrderRows, summarizePartnerSales } from '@/lib/orders/partner-sales-report'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/perks')

  let tripHelpOrders: Awaited<ReturnType<typeof fetchPartnerOrderRows>> = []
  let tripHelpSummaries: ReturnType<typeof summarizePartnerSales> = []
  try {
    tripHelpOrders = await fetchPartnerOrderRows({ limit: 50 })
    tripHelpSummaries = summarizePartnerSales(tripHelpOrders)
  } catch {
    // Migration 014 may not be applied yet
  }

  const totalTripHelpPayable = tripHelpSummaries.reduce((sum, s) => sum + s.payableAudCents, 0)

  // Stats
  const [
    { count: totalSubscribers },
    { count: totalPartners },
    { data: recentRedemptions },
    { data: recentSubs },
  ] = await Promise.all([
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('partners').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('redemptions').select('id, credits_used, created_at, partners(name), partner_services(name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('subscriptions').select('created_at, status, plans(name)').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-sm text-[#6B7280]">DriftPass internal</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Members', value: totalSubscribers ?? 0, color: 'text-[#00FF7F]' },
            { label: 'Active partners', value: totalPartners ?? 0, color: 'text-[#FF6B35]' },
            { label: 'Membership', value: 'Free', color: 'text-white' },
            { label: 'Phase', value: process.env.NEXT_PUBLIC_PHASE ?? '2', color: 'text-[#9CA3AF]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
              <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
              <div className="text-xs text-[#6B7280]">{label}</div>
            </div>
          ))}
        </div>

        {/* Recent Subscriptions */}
        <section>
          <h2 className="font-semibold mb-3">Recent subscriptions</h2>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl divide-y divide-[#2A2A2A]">
            {(recentSubs ?? []).map((s) => {
              const plan = s.plans as { name?: string } | null
              return (
                <div key={s.created_at} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{plan?.name ?? '—'}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-[#00FF7F]/10 text-[#00FF7F]' : 'bg-[#2A2A2A] text-[#6B7280]'}`}>
                      {s.status}
                    </span>
                  </div>
                  <span className="text-[#6B7280] text-xs">{formatDate(s.created_at)}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Trip Help partner payouts */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-semibold">Trip Help sales</h2>
            <span className="text-xs text-[#6B7280]">
              Pay partners when status = collected
            </span>
          </div>

          {tripHelpSummaries.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-6 text-sm text-[#6B7280]">
              No Trip Help orders yet. Run migration 014 if this section fails to load.
            </div>
          ) : (
            <>
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl divide-y divide-[#2A2A2A] mb-4">
                {tripHelpSummaries.map((s) => (
                  <div key={s.partnerSlug} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{s.partnerName}</span>
                      <span className="text-[#6B7280] ml-2">
                        {s.collectedCount}/{s.orderCount} collected
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-[#00FF7F] font-medium">{formatAUD(s.payableAudCents)}</div>
                      <div className="text-[#6B7280] text-xs">{formatAUD(s.grossAudCents)} gross</div>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3 flex items-center justify-between text-sm font-semibold">
                  <span>Total payable</span>
                  <span className="text-[#00FF7F]">{formatAUD(totalTripHelpPayable)}</span>
                </div>
              </div>

              <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">Recent orders</h3>
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl divide-y divide-[#2A2A2A]">
                {tripHelpOrders.slice(0, 15).map((order) => (
                  <div key={order.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{order.product_name}</span>
                      <span className="text-[#6B7280] ml-2">@ {order.partner?.name}</span>
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'collected'
                            ? 'bg-[#00FF7F]/10 text-[#00FF7F]'
                            : order.status === 'paid'
                              ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                              : 'bg-[#2A2A2A] text-[#6B7280]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div>{formatAUD(order.amount_aud_cents)}</div>
                      <div className="text-[#6B7280] text-xs">
                        partner {formatAUD(order.partner_payout_cents)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Recent Redemptions */}
        <section>
          <h2 className="font-semibold mb-3">Recent redemptions</h2>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl divide-y divide-[#2A2A2A]">
            {(recentRedemptions ?? []).map((r) => {
              const partner = r.partners as { name?: string } | null
              const service = r.partner_services as { name?: string } | null
              return (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{service?.name}</span>
                    <span className="text-[#6B7280] ml-2">@ {partner?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#FF6B35]">-{r.credits_used}cr</span>
                    <span className="text-[#6B7280] text-xs">{formatDate(r.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
