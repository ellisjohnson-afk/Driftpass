import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { formatDate, formatAUD } from '@/lib/utils/format'
import { getCreditBalance } from '@/lib/credits/engine'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { subscribed?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account')

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
    .maybeSingle()

  const plan = sub?.plans as { name?: string; price_aud_cents?: number; credits_per_month?: number } | null
  const hasActivePass = sub?.status === 'active'
  const balance = hasActivePass ? await getCreditBalance(user.id) : null
  const justSubscribed = searchParams.subscribed === 'true'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">My Account</h1>
        <p className="text-sm text-[#6B7280] mt-1">{profile?.email ?? user.email}</p>
      </div>

      {justSubscribed && hasActivePass && (
        <div className="bg-[#00FF7F]/10 border border-[#00FF7F]/30 rounded-xl px-4 py-3 text-sm text-[#00FF7F]">
          Pass activated — open My Pass below to get your PIN.
        </div>
      )}

      {/* Pass card — main destination after login */}
      {hasActivePass && balance ? (
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#00FF7F]/40 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">Your pass</div>
              <div className="text-3xl font-bold text-[#00FF7F]">
                {balance.remaining_credits}
                <span className="text-base text-[#6B7280] font-normal"> credits</span>
              </div>
              <div className="text-sm text-[#9CA3AF] mt-1">{plan?.name ?? 'DriftPass'} plan</div>
            </div>
            <Link
              href="/pass"
              className="shrink-0 bg-[#00FF7F] text-[#0A0A0A] px-5 py-3 rounded-xl font-bold hover:bg-[#00E070] transition-colors"
            >
              Open My Pass →
            </Link>
          </div>
          <p className="text-xs text-[#6B7280]">
            Resets {formatDate(balance.period_end)} · {balance.used_credits} credits used this period
          </p>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🎫</div>
          <h2 className="font-bold mb-2">No active pass yet</h2>
          <p className="text-sm text-[#9CA3AF] mb-5">
            You&apos;re signed in as {profile?.email ?? user.email}. Choose a plan to activate credits and your PIN.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-[#00FF7F] text-[#0A0A0A] px-8 py-3 rounded-xl font-bold hover:bg-[#00E070] transition-colors"
          >
            Choose a plan →
          </Link>
        </div>
      )}

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

      {/* Subscription details */}
      {hasActivePass && sub && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm text-[#9CA3AF] uppercase tracking-wide">Billing</h2>
          <div className="space-y-2">
            <Row label="Plan" value={plan?.name ?? '—'} />
            <Row label="Price" value={plan?.price_aud_cents ? `${formatAUD(plan.price_aud_cents)} / 2 weeks` : '—'} />
            <Row
              label="Status"
              value={
                sub.cancel_at_period_end
                  ? `Cancels ${formatDate(sub.current_period_end)}`
                  : sub.status
              }
              highlight={!sub.cancel_at_period_end}
            />
            <Row label="Next billing" value={sub.current_period_end ? formatDate(sub.current_period_end) : '—'} />
          </div>
          <ManageSubscriptionButton />
        </div>
      )}

      <SignOutButton />
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[#6B7280]">{label}</span>
      <span className={highlight ? 'text-[#00FF7F] font-medium capitalize' : 'text-white capitalize'}>{value}</span>
    </div>
  )
}

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
