import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPassPIN } from '@/lib/qr/generator'
import { PASS_ACTIVE_STATUSES } from '@/lib/subscriptions/active-status'

export interface MemberPinLookup {
  userId: string
  subscriptionId: string
  memberName: string
  planName: string
}

export async function lookupMemberByPin(pin: string): Promise<MemberPinLookup | null> {
  const cleanPin = pin.replace(/\D/g, '')
  if (cleanPin.length !== 6) return null

  const admin = createAdminClient()
  const shard = cleanPin.slice(0, 2)

  const { data: subs } = await admin
    .from('subscriptions')
    .select('id, user_id, plans(name)')
    .in('status', [...PASS_ACTIVE_STATUSES])
    .eq('pin_shard', shard)

  const matched = subs?.find((sub) => verifyPassPIN(cleanPin, sub.user_id, sub.id))
  if (!matched) return null

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', matched.user_id)
    .single()

  const plan = matched.plans as { name?: string } | null

  return {
    userId: matched.user_id,
    subscriptionId: matched.id,
    memberName: profile?.full_name ?? 'DriftPass Member',
    planName: plan?.name ?? 'Drift Pass Membership',
  }
}
