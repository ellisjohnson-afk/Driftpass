import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatAUD, formatDate } from '@/lib/utils/format'

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

  if (!profile?.is_admin) redirect('/dashboard')

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
            { label: 'Active subscribers', value: totalSubscribers ?? 0, color: 'text-[#00FF7F]' },
            { label: 'Active partners', value: totalPartners ?? 0, color: 'text-[#FF6B35]' },
            { label: 'MRR (est.)', value: formatAUD((totalSubscribers ?? 0) * 4700), color: 'text-white' },
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
