import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, TOPUP_PACKAGES } from '@/lib/stripe/config'

const TopupSchema = z.object({
  packageIndex: z.number().int().min(0).max(2),
})

// POST /api/credits/topup — create a Stripe Payment Intent for credit topup
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Must have an active subscription to buy topups
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, stripe_customer_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!sub) {
    return NextResponse.json(
      { error: 'Active subscription required to purchase credits' },
      { status: 403 }
    )
  }

  const body = await req.json() as unknown
  const parsed = TopupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
  }

  const pkg = TOPUP_PACKAGES[parsed.data.packageIndex]
  if (!pkg) {
    return NextResponse.json({ error: 'Invalid package index' }, { status: 400 })
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: pkg.price_aud_cents,
    currency: 'aud',
    customer: sub.stripe_customer_id,
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: user.id,
      subscriptionId: sub.id,
      credits: pkg.credits.toString(),
      type: 'credit_topup',
    },
    description: pkg.label,
  })

  // Pre-create topup record (confirmed on webhook)
  await createAdminClient()
    .from('credit_topups')
    .insert({
      user_id: user.id,
      credits_purchased: pkg.credits,
      aud_charged_cents: pkg.price_aud_cents,
      stripe_payment_intent_id: paymentIntent.id,
    })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    credits: pkg.credits,
    amountAud: pkg.price_aud_cents / 100,
  })
}
