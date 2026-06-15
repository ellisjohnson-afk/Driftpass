import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { TripHelpMarketplace, TripHelpUtilityGrid } from '@/components/trip-help'

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

  return (
    <div className="space-y-8 animate-fade-in pb-2">
      <header>
        <p className="text-xs uppercase tracking-widest text-drift-gold-mid">Trips</p>
        <h1 className="mt-1 text-2xl font-bold">Trip Help</h1>
        <p className="mt-1 text-sm text-drift-text-muted">
          Traveller utilities and member marketplace deals.
        </p>
      </header>

      <TripHelpUtilityGrid />
      <TripHelpMarketplace />
    </div>
  )
}
