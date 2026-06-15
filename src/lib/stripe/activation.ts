import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PLAN_BY_SLUG, getPlanByPriceId } from '@/constants/plans'
import { STRIPE_PRICE_IDS, stripe } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { userPinShard } from '@/lib/qr/generator'
import { PASS_ACTIVE_STATUSES } from '@/lib/subscriptions/active-status'
import type { Database } from '@/types/database.types'
import type { Plan, PlanSlug } from '@/types'

type AdminClient = SupabaseClient<Database>

const ALLOWED_DB_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
])

export function normalizeSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): Database['public']['Tables']['subscriptions']['Row']['status'] {
  if (ALLOWED_DB_STATUSES.has(stripeStatus)) {
    return stripeStatus as Database['public']['Tables']['subscriptions']['Row']['status']
  }
  // Stripe may add statuses (e.g. paused) — keep paid subscribers usable
  if (stripeStatus === 'paused') return 'active'
  return 'active'
}

export function resolvePlanSlugFromStripe(
  session: Stripe.Checkout.Session,
  stripeSubscription: Stripe.Subscription
): string | null {
  const candidates = [
    session.metadata?.planSlug,
    stripeSubscription.metadata?.planSlug,
  ]

  for (const slug of candidates) {
    if (slug && slug in PLAN_BY_SLUG) return slug
  }

  const priceId = stripeSubscription.items.data[0]?.price?.id
  if (!priceId) return null

  const fromEnv = Object.entries(STRIPE_PRICE_IDS).find(([, id]) => id === priceId)
  if (fromEnv) return fromEnv[0]

  return getPlanByPriceId(priceId)?.slug ?? null
}

export async function resolvePlanSlugForCheckout(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
  stripeSubscription: Stripe.Subscription
): Promise<string | null> {
  const fromStripe = resolvePlanSlugFromStripe(session, stripeSubscription)
  if (fromStripe) return fromStripe

  const planId = session.metadata?.planId ?? stripeSubscription.metadata?.planId
  if (!planId) return null

  const { data, error } = await admin.from('plans').select('slug').eq('id', planId).single()
  if (error || !data?.slug) {
    console.error('[Stripe activation] planId metadata lookup failed', planId, error?.message)
    return null
  }

  return data.slug in PLAN_BY_SLUG ? data.slug : null
}

export async function resolveUserIdFromStripe(
  session: Stripe.Checkout.Session
): Promise<string | null> {
  if (session.metadata?.userId) return session.metadata.userId

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id

  if (!customerId) return null

  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return customer.metadata?.userId ?? null
}

export async function ensureProfileExists(
  admin: AdminClient,
  userId: string
): Promise<boolean> {
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return true

  const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId)
  if (authError || !authData.user) {
    console.error('[Stripe activation] auth user not found for userId', userId, authError?.message)
    return false
  }

  const user = authData.user
  const { error: insertError } = await admin.from('profiles').upsert({
    id: userId,
    email: user.email ?? '',
    full_name:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split('@')[0] ??
      'Drifter',
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  })

  if (insertError) {
    console.error('[Stripe activation] profile upsert failed', userId, insertError.message)
    return false
  }

  return true
}

export function requirePlanDefinitionBySlug(slug: string): Plan {
  if (!(slug in PLAN_BY_SLUG)) {
    throw new Error(`Unable to resolve plan for subscription activation: ${slug}`)
  }
  return PLAN_BY_SLUG[slug as PlanSlug]
}

export async function getPlanRowBySlug(admin: AdminClient, slug: string) {
  const { data, error } = await admin
    .from('plans')
    .select('id, slug, name, credits_per_month')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('[Stripe activation] plan row missing for slug', slug, error?.message)
    return null
  }

  return data
}

export async function requirePlanRowBySlug(admin: AdminClient, slug: string) {
  const planRow = await getPlanRowBySlug(admin, slug)
  if (!planRow) {
    throw new Error(`Unable to resolve plan row for subscription activation: ${slug}`)
  }
  return planRow
}

export async function subscriptionHasInitialCredits(
  admin: AdminClient,
  subscriptionId: string
): Promise<boolean> {
  const { count, error } = await admin
    .from('credit_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_id', subscriptionId)
    .eq('type', 'credit')

  if (error) {
    console.error('[Stripe activation] credit check failed', subscriptionId, error.message)
    return false
  }

  return (count ?? 0) > 0
}

export async function resolvePlanSlugForSubscription(
  admin: AdminClient,
  stripeSubscription: Stripe.Subscription,
  sessionMetadata?: Stripe.Metadata | null
): Promise<string | null> {
  const fromStripe = resolvePlanSlugFromStripe(
    { metadata: sessionMetadata ?? undefined } as Stripe.Checkout.Session,
    stripeSubscription
  )
  if (fromStripe) return fromStripe

  const planId = sessionMetadata?.planId ?? stripeSubscription.metadata?.planId
  if (!planId) return null

  const { data, error } = await admin.from('plans').select('slug').eq('id', planId).single()
  if (error || !data?.slug) {
    console.error('[Stripe activation] planId metadata lookup failed', planId, error?.message)
    return null
  }

  return data.slug in PLAN_BY_SLUG ? data.slug : null
}

/** Upsert subscription row and grant initial credits (webhook + post-checkout sync). */
export async function persistSubscriptionActivation(
  admin: AdminClient,
  params: {
    userId: string
    customerId: string
    stripeSubscription: Stripe.Subscription
    planSlug: string
  }
): Promise<{ subscriptionId: string; created: boolean }> {
  const { userId, customerId, stripeSubscription, planSlug } = params
  const plan = requirePlanDefinitionBySlug(planSlug)
  const planRow = await requirePlanRowBySlug(admin, planSlug)

  const profileOk = await ensureProfileExists(admin, userId)
  if (!profileOk) {
    throw new Error(`profile missing for user ${userId}`)
  }

  const periodStartUnix =
    stripeSubscription.current_period_start ?? stripeSubscription.billing_cycle_anchor
  const periodEndUnix =
    stripeSubscription.current_period_end ?? stripeSubscription.billing_cycle_anchor

  if (periodStartUnix == null || periodEndUnix == null) {
    throw new Error('Unable to resolve subscription billing period for activation')
  }

  const { data: existing } = await admin
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', stripeSubscription.id)
    .maybeSingle()

  const status = normalizeSubscriptionStatus(stripeSubscription.status)

  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_id: planRow.id,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: customerId,
        status,
        current_period_start: new Date(periodStartUnix * 1000).toISOString(),
        current_period_end: new Date(periodEndUnix * 1000).toISOString(),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        pin_shard: userPinShard(userId),
      },
      { onConflict: 'stripe_subscription_id' }
    )
    .select('id, user_id, plan_id')
    .single()

  if (subError || !sub) {
    throw new Error(subError?.message ?? 'subscription upsert returned no row')
  }

  if (plan.credits_per_month > 0) {
    const alreadyCredited = await subscriptionHasInitialCredits(admin, sub.id)
    if (!alreadyCredited) {
      const { error: creditError } = await admin.rpc('credit_monthly_allowance', {
        p_user_id: userId,
        p_subscription_id: sub.id,
        p_plan_id: planRow.id,
      })

      if (creditError) {
        throw new Error(`credit_monthly_allowance failed: ${creditError.message}`)
      }
    }
  }

  return { subscriptionId: sub.id, created: !existing }
}

/** Activate from a completed Checkout session (success redirect or webhook). */
export async function activateCheckoutSession(
  sessionId: string,
  expectedUserId?: string
): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  })

  if (session.mode !== 'subscription') {
    throw new Error('Checkout session is not a subscription')
  }

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    throw new Error('Checkout session is not paid yet')
  }

  const userId = await resolveUserIdFromStripe(session)
  if (!userId) {
    throw new Error('Checkout session missing user mapping')
  }

  if (expectedUserId && userId !== expectedUserId) {
    throw new Error('Checkout session belongs to a different user')
  }

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id

  if (!subscriptionId || !customerId) {
    throw new Error('Checkout session missing subscription or customer')
  }

  const stripeSubscription =
    typeof session.subscription === 'object' && session.subscription
      ? session.subscription
      : await stripe.subscriptions.retrieve(subscriptionId)

  const admin = createAdminClient()
  const planSlug = await resolvePlanSlugForSubscription(admin, stripeSubscription, session.metadata)
  if (!planSlug) {
    throw new Error('Unable to resolve plan for subscription activation')
  }

  await persistSubscriptionActivation(admin, {
    userId,
    customerId,
    stripeSubscription,
    planSlug,
  })
}

/** Fallback when webhooks have not fired yet (common on localhost). */
export async function syncStripeSubscriptionForUser(userId: string): Promise<boolean> {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .in('status', [...PASS_ACTIVE_STATUSES])
    .maybeSingle()

  if (existing) return true

  const search = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  })

  let customerId = search.data[0]?.id

  if (!customerId) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.email) {
      const listed = await stripe.customers.list({ email: profile.email, limit: 10 })
      customerId =
        listed.data.find((customer) => customer.metadata?.userId === userId)?.id ??
        listed.data[0]?.id
    }
  }

  if (!customerId) return false

  const subs = await stripe.subscriptions.list({ customer: customerId, limit: 10 })
  const stripeSubscription = subs.data.find(
    (sub) => sub.status === 'active' || sub.status === 'trialing'
  )

  if (!stripeSubscription) return false

  const planSlug = await resolvePlanSlugForSubscription(admin, stripeSubscription)
  if (!planSlug) return false

  await persistSubscriptionActivation(admin, {
    userId,
    customerId,
    stripeSubscription,
    planSlug,
  })

  return true
}
