import { createAdminClient } from '@/lib/supabase/admin'
import { userPinShard } from '@/lib/qr/generator'
import { PASS_ACTIVE_STATUSES } from '@/lib/subscriptions/active-status'
import { ensureProfileExists } from '@/lib/stripe/activation'

export async function activateFreeMembership(
  userId: string
): Promise<{ subscriptionId: string; alreadyActive: boolean }> {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('status', [...PASS_ACTIVE_STATUSES])
    .maybeSingle()

  if (existing) {
    return { subscriptionId: existing.id, alreadyActive: true }
  }

  const profileOk = await ensureProfileExists(admin, userId)
  if (!profileOk) {
    throw new Error(`profile missing for user ${userId}`)
  }

  const { data: planRow, error: planError } = await admin
    .from('plans')
    .select('id')
    .eq('slug', 'membership')
    .eq('is_active', true)
    .maybeSingle()

  if (planError || !planRow) {
    throw new Error('Membership plan not configured in database')
  }

  const periodStart = new Date()
  const periodEnd = new Date(periodStart)
  periodEnd.setFullYear(periodEnd.getFullYear() + 50)

  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planRow.id,
      stripe_subscription_id: null,
      stripe_customer_id: null,
      status: 'active',
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      pin_shard: userPinShard(userId),
    })
    .select('id')
    .single()

  if (subError || !sub) {
    throw new Error(subError?.message ?? 'Failed to create free membership')
  }

  return { subscriptionId: sub.id, alreadyActive: false }
}

export function isFreeMembershipSubscription(
  sub: { stripe_subscription_id: string | null } | null | undefined
): boolean {
  return Boolean(sub && !sub.stripe_subscription_id)
}
