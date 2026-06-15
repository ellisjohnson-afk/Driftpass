import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendSubscriptionCanceledEmail } from '@/lib/email/resend'
import { stripe } from '@/lib/stripe/config'
import {
  activateCheckoutSession,
  normalizeSubscriptionStatus,
  requirePlanDefinitionBySlug,
  resolveUserIdFromStripe,
} from '@/lib/stripe/activation'

// ============================================================
// Stripe Webhook Event Handlers
// Called from /api/stripe/webhook/route.ts after signature verification.
// All handlers use the service-role admin client — RLS bypassed.
// ============================================================

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  if (session.mode !== 'subscription') return

  const userId = await resolveUserIdFromStripe(session)
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id

  if (!userId || !subscriptionId || !customerId) {
    console.error('[Webhook] checkout.session.completed missing mapping', {
      sessionId: session.id,
      userId,
      subscriptionId,
      customerId,
      metadata: session.metadata,
    })
    throw new Error('checkout.session.completed missing user/subscription/customer mapping')
  }

  await activateCheckoutSession(session.id)

  const planSlug = session.metadata?.planSlug
  if (!planSlug) return

  const plan = requirePlanDefinitionBySlug(planSlug)
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (profile) {
    try {
      await sendWelcomeEmail({
        to: profile.email,
        name: profile.full_name ?? 'Drifter',
        planName: plan.name,
        credits: plan.credits_per_month,
      })
    } catch (emailError) {
      console.warn('[Webhook] welcome email failed (non-fatal)', emailError)
    }
  }

  console.log('[Webhook] subscription activated', {
    sessionId: session.id,
    userId,
    planSlug,
  })
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription || !invoice.customer) return

  // Initial credits are granted in checkout.session.completed
  if (invoice.billing_reason === 'subscription_create') return

  if (invoice.billing_reason !== 'subscription_cycle') return

  const supabase = createAdminClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!sub) {
    console.warn('[Webhook] invoice.paid renewal — subscription row not found', invoice.subscription)
    return
  }

  const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription as string)

  await supabase
    .from('subscriptions')
    .update({
      status: normalizeSubscriptionStatus(stripeSub.status),
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
    })
    .eq('id', sub.id)

  const { data: planRow } = await supabase
    .from('plans')
    .select('credits_per_month')
    .eq('id', sub.plan_id)
    .single()

  if (!planRow || planRow.credits_per_month <= 0) return

  const { error: creditError } = await supabase.rpc('credit_monthly_allowance', {
    p_user_id: sub.user_id,
    p_subscription_id: sub.id,
    p_plan_id: sub.plan_id,
  })

  if (creditError) {
    console.error('[Webhook] renewal credit_monthly_allowance failed', creditError.message)
    throw new Error(`renewal credit failed: ${creditError.message}`)
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: normalizeSubscriptionStatus(subscription.status),
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('[Webhook] subscription.updated failed', subscription.id, error.message)
    throw new Error(error.message)
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id)

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
      try {
        await sendSubscriptionCanceledEmail({
          to: profile.email,
          name: profile.full_name ?? 'Drifter',
        })
      } catch (emailError) {
        console.warn('[Webhook] cancel email failed (non-fatal)', emailError)
      }
    }
  }
}
