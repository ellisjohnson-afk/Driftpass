import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe/config'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getAppOriginFromRequest } from '@/lib/auth/app-origin'
import { PASS_ACTIVE_STATUSES } from '@/lib/subscriptions/active-status'

const CreateSubscriptionSchema = z.object({
  planSlug: z
    .enum(['membership', 'wanderer', 'explorer', 'nomad', 'van_lifer'])
    .default('membership'),
})

// POST /api/subscriptions — create Stripe Checkout session
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as unknown
  const parsed = CreateSubscriptionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const { planSlug } = parsed.data
  const priceId = STRIPE_PRICE_IDS[planSlug]

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price not configured for plan: ${planSlug}` },
      { status: 500 }
    )
  }

  // Service role — plan rows are app config; user-session RLS may not expose them yet.
  const admin = createAdminClient()
  const { data: planRow, error: planError } = await admin
    .from('plans')
    .select('id')
    .eq('slug', planSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (planError || !planRow) {
    console.error('[subscriptions] plan lookup failed', { planSlug, planError })
    return NextResponse.json({ error: 'Plan not configured in database' }, { status: 500 })
  }

  // Check for existing active subscription
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', [...PASS_ACTIVE_STATUSES])
    .maybeSingle()

  if (existingSub) {
    return NextResponse.json(
      { error: 'Already have an active subscription — manage via billing portal' },
      { status: 409 }
    )
  }

  // Get or create Stripe customer
  let customerId: string | undefined

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  // Check if customer already exists in Stripe
  const { data: canceledSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (canceledSub?.stripe_customer_id) {
    customerId = canceledSub.stripe_customer_id
  } else {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email!,
      name: profile?.full_name ?? undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id
  }

  // Return to the same origin as the request so auth cookies match (localhost in dev).
  const appOrigin = getAppOriginFromRequest(req)
  // Stripe replaces {CHECKOUT_SESSION_ID} literally — must not URL-encode the braces.
  const accountSuccessBase = appUrlAt(appOrigin, '/account', { subscribed: 'true' })
  const successUrl = `${accountSuccessBase}&session_id={CHECKOUT_SESSION_ID}`

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.id,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: appUrlAt(appOrigin, '/pricing'),
    metadata: {
      userId: user.id,
      planSlug,
      planId: planRow.id,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        planSlug,
        planId: planRow.id,
      },
    },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}

// DELETE /api/subscriptions — cancel at period end
export async function DELETE(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .in('status', [...PASS_ACTIVE_STATUSES])
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
  }

  // Cancel at period end — subscriber retains access until billing date
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  return NextResponse.json({ message: 'Subscription will cancel at end of period' })
}
