import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getAppOriginFromRequest } from '@/lib/auth/app-origin'

// POST /api/stripe/portal-redirect
// Creates a Stripe Customer Portal session and redirects the user
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const appOrigin = getAppOriginFromRequest(req)

  if (!user) {
    return NextResponse.redirect(appUrlAt(appOrigin, '/login', { next: '/account' }))
  }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub?.stripe_customer_id) {
    return NextResponse.redirect(appUrlAt(appOrigin, '/account'))
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: appUrlAt(appOrigin, '/account'),
  })

  return NextResponse.redirect(portalSession.url)
}
