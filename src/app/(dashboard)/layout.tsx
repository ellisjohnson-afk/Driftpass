import Link from 'next/link'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { PASS_ACTIVE_STATUSES } from '@/lib/subscriptions/active-status'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { AppShell } from '@/components/layout/AppShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()

  const pathname = (await headers()).get('x-pathname') ?? '/account'
  const isPublicPricing = pathname === '/pricing'
  const isPassPage = pathname === '/pass'
  const isPerksPage = pathname === '/perks' || pathname.startsWith('/perks/')
  const isAccountPage = pathname === '/account'

  if (!user && !isPublicPricing) {
    redirect(appUrlAt(appOrigin, '/login', { next: pathname }))
  }

  if (!user) {
    return (
      <AppShell showBottomNav={false} showHeader={false}>
        {children}
      </AppShell>
    )
  }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', [...PASS_ACTIVE_STATUSES])
    .maybeSingle()

  const hasActivePass = Boolean(sub)

  const activateBanner = !hasActivePass && !isPassPage ? (
    <div className="border-b border-drift-teal/20 bg-drift-teal/10 px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <p className="text-sm text-drift-teal">
          Activate your membership to get your PIN.
        </p>
        <Link
          href="/pricing"
          className="shrink-0 rounded-xl bg-drift-teal px-4 py-2 text-sm font-bold text-drift-navy-deep transition-colors hover:bg-drift-teal-dark"
        >
          Get membership
        </Link>
      </div>
    </div>
  ) : null

  return (
    <>
      {activateBanner}
      <AppShell
        showHeader={!isPassPage && !isPerksPage && !isAccountPage}
        showBottomNav
        exploreHref="/perks"
        passHref="/pass"
        tripsHref="/dashboard"
        profileHref="/account"
        homeHref={hasActivePass ? '/perks' : '/account'}
      >
        {children}
      </AppShell>
    </>
  )
}
