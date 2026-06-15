import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { sanitizePlanSlug } from '@/lib/auth/helpers'
import { PASS_ACTIVE_STATUSES } from '@/lib/subscriptions/active-status'
import PricingClient from './PricingClient'

export const dynamic = 'force-dynamic'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const plan = sanitizePlanSlug(searchParams.plan)
  const appOrigin = await getServerAppOrigin()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <PricingClient initialPlan={plan} backHref="/" isAuthenticated={false} />
  }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', [...PASS_ACTIVE_STATUSES])
    .maybeSingle()

  if (sub) redirect(appUrlAt(appOrigin, '/account'))

  return <PricingClient initialPlan={plan} backHref="/account" isAuthenticated />
}
