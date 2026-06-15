import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getAppOriginFromRequest } from '@/lib/auth/app-origin'

// POST /api/stripe/portal — Stripe Customer Portal (manage card, cancel, invoices)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const appOrigin = getAppOriginFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: appUrlAt(appOrigin, '/account'),
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Billing portal URL missing' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Stripe portal]', message)

    if (message.toLowerCase().includes('configuration') || message.toLowerCase().includes('portal')) {
      return NextResponse.json(
        {
          error:
            'Stripe billing portal is not configured yet. In Stripe Dashboard go to Settings → Billing → Customer portal and save a configuration.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Could not open billing portal' }, { status: 500 })
  }
}
