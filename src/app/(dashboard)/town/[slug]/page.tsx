import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getTown } from '@/lib/towns'
import { TownWelcomeContent } from '@/components/town'
import { fetchActiveShoutouts } from '@/lib/shoutouts/fetch'

export const dynamic = 'force-dynamic'

export default async function TownWelcomePage({
  params,
}: {
  params: { slug: string }
}) {
  const town = getTown(params.slug)
  if (!town) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: `/town/${params.slug}` }))

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

  let townShoutouts: Awaited<ReturnType<typeof fetchActiveShoutouts>> = []
  try {
    townShoutouts = await fetchActiveShoutouts(admin, {
      placement: 'town',
      townSlug: params.slug,
      limit: 1,
    })
  } catch {
    // Migration 017 may not be applied yet
  }

  return <TownWelcomeContent town={town} shoutouts={townShoutouts} />
}
