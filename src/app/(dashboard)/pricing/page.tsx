import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canonicalAppUrl } from '@/lib/auth/canonical-url'
import { buildLoginReturnUrl, buildPricingCheckoutPath, sanitizePlanSlug } from '@/lib/auth/helpers'
import PricingClient from './PricingClient'

export const dynamic = 'force-dynamic'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const plan = sanitizePlanSlug(searchParams.plan)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(buildLoginReturnUrl(buildPricingCheckoutPath(plan)))
  }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (sub) redirect(canonicalAppUrl('/account'))

  return <PricingClient initialPlan={plan} />
}
