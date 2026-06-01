import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_BY_SLUG } from '@/constants/plans'
import { sendWelcomeEmail, sendSubscriptionCanceledEmail } from '@/lib/email/resend'
import { userPinShard } from '@/lib/qr/generator'

// ============================================================
// Stripe Webhook Event Handlers
// Called from /api/stripe/webhook/route.ts after signature verification.
// All handlers use the service-role admin client — RLS bypassed.
// ============================================================

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  if (session.mode !== 'subscription') return

  const supabase = createAdminClient()
  const userId = session.metadata?.userId
  const planSlug = session.metadata?.planSlug

  if (!userId || !session.subscription || !session.customer) {
    console.error('Webhook: missing metadata on checkout session', session.id)
    return
  }

  // Use planSlug from metadata — already validated at checkout creation
  const plan = PLAN_BY_SLUG[planSlug ?? '']

  if (!plan) {
    console.error('Webhook: unknown planSlug in metadata', planSlug)
    return
  }

  // Get Stripe subscription details
  const { stripe } = await import('@/lib/stripe/config')
  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  // Get plan row from DB
  const { data: planRow } = await supabase
    .from('plans')
    .select('id')
    .eq('slug', plan.slug)
    .single()

  if (!planRow) return

  // Upsert subscription record
  const { data: sub } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planRow.id,
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: session.customer as string,
      status: stripeSubscription.status,
      current_period_start: new Date(
        (stripeSubscription.current_period_start ?? stripeSubscription.billing_cycle_anchor ?? 0) * 1000
      ).toISOString(),
      current_period_end: new Date(
        (stripeSubscription.current_period_end ?? stripeSubscription.billing_cycle_anchor ?? 0) * 1000
      ).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      pin_shard: userPinShard(userId),
    }, { onConflict: 'stripe_subscription_id' })
    .select()
    .single()

  if (!sub) return

  // Credit the monthly allowance
  await supabase.rpc('credit_monthly_allowance', {
    p_user_id: userId,
    p_subscription_id: sub.id,
    p_plan_id: planRow.id,
  })

  // Send welcome email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (profile) {
    await sendWelcomeEmail({
      to: profile.email,
      name: profile.full_name ?? 'Drifter',
      planName: plan.name,
      credits: plan.credits_per_month,
    })
  }
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription || !invoice.customer) return

  const supabase = createAdminClient()

  // Find subscription in our DB
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!sub) return

  // Update subscription period dates
  const { stripe } = await import('@/lib/stripe/config')
  const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription as string)

  await supabase
    .from('subscriptions')
    .update({
      status: stripeSub.status,
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
    })
    .eq('id', sub.id)

  // Credit new month's allowance (only on renewal, not initial payment)
  // Check if this is a renewal by seeing if there are existing transactions
  const { count } = await supabase
    .from('credit_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', sub.user_id)

  if (count && count > 0) {
    await supabase.rpc('credit_monthly_allowance', {
      p_user_id: sub.user_id,
      p_subscription_id: sub.id,
      p_plan_id: sub.plan_id,
    })
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id)

  // Notify user
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (sub) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', sub.user_id)
      .single()

    if (profile) {
      await sendSubscriptionCanceledEmail({
        to: profile.email,
        name: profile.full_name ?? 'Drifter',
      })
    }
  }
}
