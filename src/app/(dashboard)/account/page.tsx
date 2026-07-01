import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { formatDate } from '@/lib/utils/format'
import { isPassActive } from '@/lib/subscriptions/active-status'
import {
  activateCheckoutSession,
  syncStripeSubscriptionForUser,
} from '@/lib/stripe/activation'
import { isFreeMembershipSubscription } from '@/lib/subscriptions/free-membership'
import { computeProfileStats, formatMemberSince } from '@/lib/profile/stats'
import {
  LifetimeSavingsCard,
  ProfileAvatarEditor,
  ProfileMenu,
  ProfileStatsRow,
} from '@/components/profile'
import { StatusPill } from '@/components/ui/StatusPill'
import { NoHistoryEmptyState, NoPassEmptyState } from '@/components/ui'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function isCheckoutSessionId(value: string | undefined): boolean {
  return Boolean(value && value.startsWith('cs_') && !value.includes('{'))
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { subscribed?: string; session_id?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
    .select('full_name, email, avatar_url, traveller_type, created_at, is_admin')
    .eq('id', user.id)
    .single()

  const { data: sub } = await admin
    .from('subscriptions')
    .select('status, cancel_at_period_end, current_period_end, created_at, stripe_subscription_id, plans(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const hasActivePass = isPassActive(sub?.status)
  const isFreeMember = isFreeMembershipSubscription(sub)

  if (justSubscribed && hasActivePass) {
    redirect('/pass')
  }

  const memberName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Member'
  const memberSince = sub?.created_at ?? profile?.created_at ?? null
  const memberSinceLabel = formatMemberSince(memberSince)

  const { data: redemptions } = hasActivePass
    ? await admin
        .from('redemptions')
        .select('id, partners(city)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
    : { data: [] }

  const stats = computeProfileStats(memberSince, redemptions ?? [])

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {justSubscribed && hasActivePass && (
        <div className="rounded-2xl border border-drift-gold-to/30 bg-drift-gold-gradient/15 px-4 py-3 text-sm text-drift-gold-mid">
          Membership active — open My Pass to get your PIN.
        </div>
      )}

      {justSubscribed && !hasActivePass && (
        <div className="rounded-2xl border border-amber-800/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-300">
          Finishing activation… refresh in a few seconds, or open My Pass.
        </div>
      )}

      <section className="pt-2 text-center">
        <ProfileAvatarEditor name={memberName} avatarUrl={profile?.avatar_url} />

        <h1 className="mt-4 text-2xl font-bold">{memberName}</h1>

        {hasActivePass ? (
          <>
            <div className="mt-3 flex justify-center">
              <StatusPill
                label="Active Member"
                tone="neutral"
                className="border-drift-gold-to/40 bg-drift-gold-gradient/15 text-drift-gold-mid [&_span]:bg-drift-gold-mid"
              />
            </div>
            {memberSinceLabel ? (
              <p className="mt-2 text-sm text-drift-text-muted">Member since {memberSinceLabel}</p>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-drift-text-muted">{profile?.email ?? user.email}</p>
        )}
      </section>

      {hasActivePass ? (
        <>
          <LifetimeSavingsCard amountCents={stats.lifetimeSavingsCents} />

          <ProfileStatsRow
            stats={[
              { value: String(stats.dealsClaimed), label: 'Deals Claimed' },
              { value: String(stats.citiesVisited), label: 'Cities Visited' },
              { value: String(stats.daysTraveling), label: 'Days Traveling' },
            ]}
          />

          {stats.dealsClaimed === 0 ? <NoHistoryEmptyState /> : null}

          {sub?.cancel_at_period_end && sub.current_period_end && !isFreeMember ? (
            <div className="rounded-2xl border border-yellow-800/60 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-300">
              Your membership ends on {formatDate(sub.current_period_end)}. Manage billing below
              to keep your pass active.
            </div>
          ) : null}

          <ProfileMenu showBilling={!isFreeMember} />

          <Link
            href="/pass"
            className="flex w-full items-center justify-center rounded-2xl border border-drift-border bg-drift-navy-light px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-drift-gold-to/40 hover:text-drift-gold-mid"
          >
            Open My Pass
          </Link>
        </>
      ) : justSubscribed ? (
        <div className="rounded-3xl border border-amber-800/50 bg-amber-900/20 px-6 py-8 text-center">
          <h2 className="font-bold text-amber-200">Finishing activation…</h2>
          <p className="mt-2 text-sm text-amber-300/90">
            We are syncing your pass now. Refresh in a few seconds or open My Pass.
          </p>
          <Link
            href="/pass"
            className="mt-5 inline-flex rounded-2xl bg-drift-gold-gradient px-6 py-3 text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
          >
            Open My Pass
          </Link>
        </div>
      ) : (
        <NoPassEmptyState />
      )}

      {profile?.is_admin ? (
        <Link
          href="/admin"
          className="flex w-full items-center justify-between rounded-2xl border border-[#00FF7F]/30 bg-[#00FF7F]/10 px-4 py-4 text-sm font-semibold text-[#00FF7F] transition-colors hover:border-[#00FF7F]/50 hover:bg-[#00FF7F]/15"
        >
          <span>Admin dashboard</span>
          <span aria-hidden>→</span>
        </Link>
      ) : null}

      <details className="rounded-2xl border border-drift-border/60 bg-drift-navy-light px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-drift-text-muted">
          Account details
        </summary>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-drift-text-muted">Email</dt>
            <dd className="text-right text-white">{profile?.email ?? user.email ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-drift-text-muted">Traveller type</dt>
            <dd className="text-right capitalize text-white">
              {profile?.traveller_type?.replace('_', ' ') ?? '—'}
            </dd>
          </div>
          {hasActivePass && sub && !isFreeMember ? (
            <div className="flex justify-between gap-4">
              <dt className="text-drift-text-muted">Next billing</dt>
              <dd className="text-right text-white">
                {sub.current_period_end ? formatDate(sub.current_period_end) : '—'}
              </dd>
            </div>
          ) : null}
          {hasActivePass && isFreeMember ? (
            <div className="flex justify-between gap-4">
              <dt className="text-drift-text-muted">Membership</dt>
              <dd className="text-right text-white">Free</dd>
            </div>
          ) : null}
        </dl>
      </details>

      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="w-full rounded-2xl border border-drift-border py-3 text-sm text-drift-text-muted transition-colors hover:border-red-800/60 hover:text-red-400"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
