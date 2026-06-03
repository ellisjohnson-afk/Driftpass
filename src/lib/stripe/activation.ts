import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PLAN_BY_SLUG, getPlanByPriceId } from '@/constants/plans'
import { STRIPE_PRICE_IDS, stripe } from '@/lib/stripe/config'
import type { Database } from '@/types/database.types'
import type { Plan } from '@/types'

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
  const plan = PLAN_BY_SLUG[slug]
  if (!plan) {
    throw new Error(`Unable to resolve plan for subscription activation: ${slug}`)
  }
  return plan
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
