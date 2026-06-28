import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getTown } from '@/lib/towns'
import { TripHelpMarketplace, TripHelpUtilityGrid, TripHelpTabs, EssentialsFaq } from '@/components/trip-help'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function TripHelpPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: '/trip-help' }))

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub || !isPassActive(sub.status)) {
    redirect(appUrlAt(appOrigin, '/pricing'))
  }

  const town = getTown('airlie-beach')
  const essentials = town?.essentials ?? []

  return (
    <div className="space-y-8 animate-fade-in pb-2">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-drift-gold-mid">Trip Help</p>
          <h1 className="mt-1 text-2xl font-bold">Trip Help</h1>
          <p className="mt-1 text-sm text-drift-text-muted">
            Traveller utilities and local essentials for Airlie Beach.
          </p>
        </div>
        <Link
          href="/trip-help/orders"
          className="shrink-0 rounded-xl border border-drift-border px-3 py-2 text-xs font-semibold text-drift-gold-mid transition-colors hover:border-drift-gold-to/40 hover:text-white"
        >
          My purchases
        </Link>
      </header>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-drift-navy-light" />}>
        <TripHelpTabs
          utilities={
            <div className="space-y-8">
              <TripHelpUtilityGrid />
              <TripHelpMarketplace />
            </div>
          }
          essentials={<EssentialsFaq items={essentials} />}
        />
      </Suspense>
    </div>
  )
}
