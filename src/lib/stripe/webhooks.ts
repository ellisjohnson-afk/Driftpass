import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendSubscriptionCanceledEmail } from '@/lib/email/resend'
import { userPinShard } from '@/lib/qr/generator'
import { stripe } from '@/lib/stripe/config'
import {
  ensureProfileExists,
  normalizeSubscriptionStatus,
  requirePlanDefinitionBySlug,
  requirePlanRowBySlug,
  resolvePlanSlugForCheckout,
  resolveUserIdFromStripe,
  subscriptionHasInitialCredits,
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

  const supabase = createAdminClient()
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

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  const planSlug = await resolvePlanSlugForCheckout(supabase, session, stripeSubscription)

  if (!planSlug) {
    console.error('[Webhook] could not resolve plan from checkout session', {
      sessionId: session.id,
      metadata: session.metadata,
      subMetadata: stripeSubscription.metadata,
      priceId: stripeSubscription.items.data[0]?.price?.id,
    })
    throw new Error('Unable to resolve plan for subscription activation')
  }

  const plan = requirePlanDefinitionBySlug(planSlug)
  const planRow = await requirePlanRowBySlug(supabase, planSlug)

  const profileOk = await ensureProfileExists(supabase, userId)
  if (!profileOk) {
    throw new Error(`checkout.session.completed profile missing for user ${userId}`)
  }

  const periodStartUnix =
    stripeSubscription.current_period_start ?? stripeSubscription.billing_cycle_anchor
  const periodEndUnix =
    stripeSubscription.current_period_end ?? stripeSubscription.billing_cycle_anchor

  if (periodStartUnix == null || periodEndUnix == null) {
    throw new Error('Unable to resolve subscription billing period for activation')
  }

  const status = normalizeSubscriptionStatus(stripeSubscription.status)

  const { data: sub, error: subError } = await supabase
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
    console.error('[Webhook] subscription upsert failed', {
      sessionId: session.id,
      userId,
      planSlug,
      error: subError?.message,
    })
    throw new Error(subError?.message ?? 'subscription upsert returned no row')
  }

  const alreadyCredited = await subscriptionHasInitialCredits(supabase, sub.id)
  if (!alreadyCredited) {
    const { error: creditError } = await supabase.rpc('credit_monthly_allowance', {
      p_user_id: userId,
      p_subscription_id: sub.id,
      p_plan_id: planRow.id,
    })

    if (creditError) {
      console.error('[Webhook] credit_monthly_allowance failed', {
        sessionId: session.id,
        userId,
        subscriptionId: sub.id,
        planSlug,
        error: creditError.message,
      })
      throw new Error(`credit_monthly_allowance failed: ${creditError.message}`)
    }
  }

  console.log('[Webhook] subscription activated', {
    sessionId: session.id,
    userId,
    planSlug,
    subscriptionId: sub.id,
    status,
    creditsGranted: !alreadyCredited,
  })

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
