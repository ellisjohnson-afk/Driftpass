import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { getAppOrigin } from '@/lib/auth/app-origin'

// POST /api/stripe/portal-redirect
// Creates a Stripe Customer Portal session and redirects the user
export async function POST(req: Request) {
  const appOrigin = getAppOrigin(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login?next=/account', appOrigin))
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
    return NextResponse.redirect(new URL('/account', appOrigin))
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appOrigin}/account`,
  })

  return NextResponse.redirect(portalSession.url)
}
