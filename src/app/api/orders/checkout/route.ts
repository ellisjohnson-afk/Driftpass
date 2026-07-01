import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getAppOriginFromRequest } from '@/lib/auth/app-origin'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getPurchasableProduct } from '@/lib/orders/catalog'
import { buildOrderCheckoutMetadata } from '@/lib/orders/fulfillment'
import type { PurchasableProductType } from '@/lib/orders/types'

const CheckoutSchema = z.object({
  productType: z.enum(['trip_help', 'marketplace']),
  productSlug: z.string().min(1),
})

async function resolveStripeCustomerId(
  userId: string,
  email: string,
  fullName: string | null
): Promise<string> {
  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sub?.stripe_customer_id) return sub.stripe_customer_id

  const customer = await stripe.customers.create({
    email,
    name: fullName ?? undefined,
    metadata: { userId },
  })

  return customer.id
}

/** POST /api/orders/checkout — one-time Trip Help / marketplace purchase */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as unknown
  const parsed = CheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
  }

  const { productType, productSlug } = parsed.data
  const admin = createAdminClient()
  const product = await getPurchasableProduct(admin, productType as PurchasableProductType, productSlug)

  if (!product) {
    return NextResponse.json({ error: 'Product is not available for purchase' }, { status: 404 })
  }

  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub || !isPassActive(sub.status)) {
    return NextResponse.json(
      { error: 'Active membership required before purchasing add-ons' },
      { status: 403 }
    )
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  const customerId = await resolveStripeCustomerId(
    user.id,
    profile?.email ?? user.email!,
    profile?.full_name ?? null
  )

  const appOrigin = getAppOriginFromRequest(req)
  const successBase = appUrlAt(appOrigin, '/trip-help/receipt')
  const successUrl = `${successBase}?session_id={CHECKOUT_SESSION_ID}`
  const cancelPath =
    productType === 'trip_help' ? `/trip-help/${productSlug}` : '/trip-help'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.id,
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'aud',
          unit_amount: product.priceAudCents,
          product_data: {
            name: product.stripeProductName,
            description: product.description,
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: appUrlAt(appOrigin, cancelPath),
    metadata: buildOrderCheckoutMetadata({
      userId: user.id,
      productType: product.type,
      productSlug: product.slug,
    }),
  })

  return NextResponse.json({ url: session.url })
}
