import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { formatDate, formatAUD } from '@/lib/utils/format'
import { getCreditBalance } from '@/lib/credits/engine'
import { isPassActive } from '@/lib/subscriptions/active-status'
import {
  activateCheckoutSession,
  syncStripeSubscriptionForUser,
} from '@/lib/stripe/activation'
import Link from 'next/link'
import { ManageBillingButton } from './ManageBillingButton'

export const dynamic = 'force-dynamic'

function isCheckoutSessionId(value: string | undefined): boolean {
  return Boolean(value && value.startsWith('cs_') && !value.includes('{'))
}

function formatPlanPrice(slug: string | undefined, priceAudCents: number | undefined): string {
  if (!priceAudCents) return '—'
  if (slug === 'membership') return `${formatAUD(priceAudCents)} / week`
  return `${formatAUD(priceAudCents)} / 2 weeks`
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { subscribed?: string; session_id?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: '/account' }))

  const sessionId = searchParams.session_id
  const justSubscribed = searchParams.subscribed === 'true'

  if (sessionId && isCheckoutSessionId(sessionId)) {
    try {
      await activateCheckoutSession(sessionId, user.id)
    } catch (error) {
      console.error('[Account] checkout session sync failed', error)
    }
  }

  if (justSubscribed || sessionId) {
    try {
      await syncStripeSubscriptionForUser(user.id)
    } catch (error) {
      console.error('[Account] stripe subscription sync failed', error)
    }
  }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, traveller_type, created_at')
    .eq('id', user.id)
    .single()

  const { data: sub } = await admin
    .from('subscriptions')
    .select('status, cancel_at_period_end, current_period_end, created_at, plans(slug, name, price_aud_cents, credits_per_month)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const plan = sub?.plans as {
    slug?: string
    name?: string
    price_aud_cents?: number
    credits_per_month?: number
  } | null
  const hasActivePass = isPassActive(sub?.status)
  const balance = hasActivePass && (plan?.credits_per_month ?? 0) > 0
    ? await getCreditBalance(user.id)
    : null

  if (justSubscribed && hasActivePass) {
    redirect('/pass')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">My Account</h1>
        <p className="text-sm text-[#6B7280] mt-1">{profile?.email ?? user.email}</p>
      </div>

      {justSubscribed && hasActivePass && (
        <div className="bg-[#00FF7F]/10 border border-[#00FF7F]/30 rounded-xl px-4 py-3 text-sm text-[#00FF7F]">
          Membership active — open My Pass to get your PIN.
        </div>
      )}

      {justSubscribed && !hasActivePass && (
        <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl px-4 py-3 text-sm text-amber-300">
          Finishing activation… refresh in a few seconds, or open My Pass.
        </div>
      )}

      {hasActivePass ? (
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#00FF7F]/40 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">Your membership</div>
              {balance ? (
                <>
                  <div className="text-3xl font-bold text-[#00FF7F]">
                    {balance.remaining_credits}
                    <span className="text-base text-[#6B7280] font-normal"> credits</span>
                  </div>
                  <div className="text-sm text-[#9CA3AF] mt-1">{plan?.name ?? 'DriftPass'}</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-[#00FF7F]">
                    {plan?.name ?? 'Drift Pass Membership'}
                  </div>
                  <div className="text-sm text-[#9CA3AF] mt-1">Active member · A$7.99/week</div>
                </>
              )}
            </div>
            <Link
              href="/pass"
              className="shrink-0 bg-[#00FF7F] text-[#0A0A0A] px-5 py-3 rounded-xl font-bold hover:bg-[#00E070] transition-colors"
            >
              Open My Pass →
            </Link>
          </div>
          {balance && (
            <p className="text-xs text-[#6B7280]">
              Resets {formatDate(balance.period_end)} · {balance.used_credits} credits used this period
            </p>
          )}
        </div>
      ) : (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🎫</div>
          <h2 className="font-bold mb-2">Membership not active yet</h2>
          <p className="text-sm text-[#9CA3AF] mb-5">
            {justSubscribed
              ? 'Payment received — we are syncing your pass now.'
              : 'Start your Drift Pass membership to unlock your PIN and member perks.'}
          </p>
          {!justSubscribed && (
            <Link
              href="/pricing"
              className="inline-block bg-[#00FF7F] text-[#0A0A0A] px-8 py-3 rounded-xl font-bold hover:bg-[#00E070] transition-colors"
            >
              Start membership →
            </Link>
          )}
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-sm text-[#9CA3AF] uppercase tracking-wide">Profile</h2>
        <div className="space-y-2">
          <Row label="Name" value={profile?.full_name ?? '—'} />
          <Row label="Email" value={profile?.email ?? user.email ?? '—'} />
          <Row label="Traveller type" value={profile?.traveller_type?.replace('_', ' ') ?? '—'} />
          <Row label="Member since" value={profile?.created_at ? formatDate(profile.created_at) : '—'} />
        </div>
      </div>

      {hasActivePass && sub && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm text-[#9CA3AF] uppercase tracking-wide">Billing</h2>
          <div className="space-y-2">
            <Row label="Plan" value={plan?.name ?? '—'} />
            <Row
              label="Price"
              value={formatPlanPrice(plan?.slug, plan?.price_aud_cents)}
            />
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
          <ManageBillingButton />
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
