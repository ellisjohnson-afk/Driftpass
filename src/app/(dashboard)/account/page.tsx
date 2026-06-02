import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { formatDate, formatAUD } from '@/lib/utils/format'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, traveller_type, created_at')
    .eq('id', user.id)
    .single()

  const { data: sub } = await admin
    .from('subscriptions')
    .select('status, cancel_at_period_end, current_period_end, created_at, plans(name, price_aud_cents, credits_per_month)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const plan = sub?.plans as { name?: string; price_aud_cents?: number; credits_per_month?: number } | null

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold">My Account</h1>

      {/* Profile */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-sm text-[#9CA3AF] uppercase tracking-wide">Profile</h2>
        <div className="space-y-2">
          <Row label="Name" value={profile?.full_name ?? '—'} />
          <Row label="Email" value={profile?.email ?? user.email ?? '—'} />
          <Row label="Traveller type" value={profile?.traveller_type?.replace('_', ' ') ?? '—'} />
          <Row label="Member since" value={profile?.created_at ? formatDate(profile.created_at) : '—'} />
        </div>
      </div>

      {/* Subscription */}
      {sub && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm text-[#9CA3AF] uppercase tracking-wide">Subscription</h2>
          <div className="space-y-2">
            <Row label="Plan" value={plan?.name ?? '—'} />
            <Row label="Price" value={plan?.price_aud_cents ? `${formatAUD(plan.price_aud_cents)}/month` : '—'} />
            <Row label="Credits" value={plan?.credits_per_month ? `${plan.credits_per_month}/month` : '—'} />
            <Row
              label="Status"
              value={
                sub.cancel_at_period_end
                  ? `Cancels ${formatDate(sub.current_period_end)}`
                  : sub.status
              }
              highlight={sub.status === 'active' && !sub.cancel_at_period_end}
            />
            <Row label="Next billing" value={sub.current_period_end ? formatDate(sub.current_period_end) : '—'} />
          </div>

          {/* Manage subscription via Stripe Customer Portal */}
          <ManageSubscriptionButton />
        </div>
      )}

      {!sub && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 text-center">
          <p className="text-[#9CA3AF] mb-4">No active subscription</p>
          <Link
            href="/pricing"
            className="bg-[#00FF7F] text-[#0A0A0A] px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#00E070] transition-colors"
          >
            Get a Pass
          </Link>
        </div>
      )}

      {/* Sign out */}
      <SignOutButton />
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[#6B7280]">{label}</span>
      <span className={highlight ? 'text-[#00FF7F] font-medium' : 'text-white'}>{value}</span>
    </div>
  )
}

// Client components for interactive buttons
function ManageSubscriptionButton() {
  return (
    <form action="/api/stripe/portal" method="POST" className="mt-4">
      <button
        type="submit"
        className="w-full border border-[#2A2A2A] text-[#9CA3AF] py-2.5 rounded-lg text-sm hover:border-[#00FF7F] hover:text-white transition-colors"
        formAction="/api/stripe/portal-redirect"
      >
        Manage billing & cancel →
      </button>
    </form>
  )
}

function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        className="w-full border border-[#2A2A2A] text-[#6B7280] py-2.5 rounded-lg text-sm hover:border-red-800 hover:text-red-400 transition-colors"
      >
        Sign out
      </button>
    </form>
  )
}
