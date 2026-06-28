import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveUserIdFromStripe, ensureProfileExists } from '@/lib/stripe/activation'
import { stripe } from '@/lib/stripe/config'
import { getPurchasableProduct, computeOrderExpiry } from '@/lib/orders/catalog'
import { generateCollectionPin } from '@/lib/orders/collection-pin'
import type { OrderVoucher, PurchasableProductType } from '@/lib/orders/types'

async function resolvePartnerIds(
  admin: ReturnType<typeof createAdminClient>,
  product: { partnerSlug: string; serviceType: string | null }
) {
  const { data: partner } = await admin
    .from('partners')
    .select('id')
    .eq('slug', product.partnerSlug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!partner) return { partnerId: null, partnerServiceId: null }

  let partnerServiceId: string | null = null
  if (product.serviceType) {
    const { data: service } = await admin
      .from('partner_services')
      .select('id')
      .eq('partner_id', partner.id)
      .eq('service_type', product.serviceType)
      .eq('is_active', true)
      .maybeSingle()
    partnerServiceId = service?.id ?? null
  }

  return { partnerId: partner.id, partnerServiceId }
}

export async function fulfillOrderFromCheckoutSession(
  sessionId: string,
  expectedUserId?: string
): Promise<OrderVoucher | null> {
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.mode !== 'payment') return null
  if (session.metadata?.orderType !== 'voucher') return null

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('order_vouchers')
    .select('*')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle()

  if (existing) return existing as OrderVoucher

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    throw new Error('Checkout session is not paid yet')
  }

  const userId = await resolveUserIdFromStripe(session)
  if (!userId) throw new Error('Checkout session missing user mapping')
  if (expectedUserId && userId !== expectedUserId) {
    throw new Error('Checkout session belongs to a different user')
  }

  const productType = session.metadata?.productType as PurchasableProductType | undefined
  const productSlug = session.metadata?.productSlug
  if (!productType || !productSlug) {
    throw new Error('Checkout session missing product metadata')
  }

  const product = getPurchasableProduct(productType, productSlug)
  if (!product) throw new Error('Unknown product in checkout session')

  const profileOk = await ensureProfileExists(admin, userId)
  if (!profileOk) throw new Error(`profile missing for user ${userId}`)

  const { partnerId, partnerServiceId } = await resolvePartnerIds(admin, product)
  const collectionPin = await generateCollectionPin(admin)
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  const { data: voucher, error } = await admin
    .from('order_vouchers')
    .insert({
      user_id: userId,
      partner_id: partnerId,
      partner_service_id: partnerServiceId,
      product_type: product.type,
      product_slug: product.slug,
      product_name: product.name,
      amount_aud_cents: product.priceAudCents,
      collection_pin: collectionPin,
      status: 'paid',
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      expires_at: computeOrderExpiry(product.expiryHours).toISOString(),
    })
    .select('*')
    .single()

  if (error || !voucher) {
    throw new Error(error?.message ?? 'Failed to create order voucher')
  }

  return voucher as OrderVoucher
}

export async function collectOrderByPin(pin: string) {
  const cleanPin = pin.replace(/\D/g, '')
  if (cleanPin.length !== 6) return { error: 'Enter a 6-digit collection PIN', status: 400 as const }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: order } = await admin
    .from('order_vouchers')
    .select('*, partners(name, slug, address, city)')
    .eq('collection_pin', cleanPin)
    .maybeSingle()

  if (!order) {
    return { error: 'Invalid collection PIN', status: 404 as const }
  }

  if (order.status === 'collected') {
    return { error: 'This order was already collected', status: 409 as const }
  }

  if (order.status !== 'paid') {
    return { error: 'This order is not available for collection', status: 400 as const }
  }

  if (order.expires_at < now) {
    await admin.from('order_vouchers').update({ status: 'expired' }).eq('id', order.id)
    return { error: 'This collection PIN has expired', status: 410 as const }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', order.user_id)
    .single()

  const { error: updateError } = await admin
    .from('order_vouchers')
    .update({ status: 'collected', collected_at: now })
    .eq('id', order.id)
    .eq('status', 'paid')

  if (updateError) {
    return { error: 'Could not mark order as collected', status: 500 as const }
  }

  return {
    status: 200 as const,
    data: {
      success: true,
      productName: order.product_name,
      memberName: profile?.full_name ?? 'DriftPass Member',
      amountAudCents: order.amount_aud_cents,
      partnerName: (order.partners as { name?: string } | null)?.name ?? 'Partner',
    },
  }
}

export function buildOrderCheckoutMetadata(params: {
  userId: string
  productType: PurchasableProductType
  productSlug: string
}) {
  return {
    orderType: 'voucher',
    userId: params.userId,
    productType: params.productType,
    productSlug: params.productSlug,
  } satisfies Stripe.MetadataParam
}
