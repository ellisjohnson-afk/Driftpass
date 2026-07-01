import { createAdminClient } from '@/lib/supabase/admin'
import { isPassActive } from '@/lib/subscriptions/active-status'
import type { SubscriptionStatus } from '@/types'

export interface AdminMemberSubscription {
  id: string
  status: SubscriptionStatus | string
  plan_name: string | null
  plan_slug: string | null
  stripe_subscription_id: string | null
  current_period_end: string
  created_at: string
}

export interface AdminMemberRow {
  id: string
  email: string
  full_name: string | null
  traveller_type: string | null
  is_admin: boolean
  created_at: string
  has_active_pass: boolean
  subscription: AdminMemberSubscription | null
  redemption_count: number
  order_count: number
}

type ProfileWithSubs = {
  id: string
  email: string
  full_name: string | null
  traveller_type: string | null
  is_admin: boolean
  created_at: string
  subscriptions: Array<{
    id: string
    status: string
    stripe_subscription_id: string | null
    current_period_end: string
    created_at: string
    plans: { name: string; slug: string } | null
  }> | null
}

function pickSubscription(
  subs: ProfileWithSubs['subscriptions']
): AdminMemberSubscription | null {
  if (!subs?.length) return null

  const sorted = [...subs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const active = sorted.find((sub) => isPassActive(sub.status))
  const chosen = active ?? sorted[0]
  if (!chosen) return null

  return {
    id: chosen.id,
    status: chosen.status,
    plan_name: chosen.plans?.name ?? null,
    plan_slug: chosen.plans?.slug ?? null,
    stripe_subscription_id: chosen.stripe_subscription_id,
    current_period_end: chosen.current_period_end,
    created_at: chosen.created_at,
  }
}

export async function fetchAdminMembers(options?: {
  query?: string
  passFilter?: 'all' | 'active' | 'inactive'
  limit?: number
}): Promise<AdminMemberRow[]> {
  const admin = createAdminClient()
  let profileQuery = admin
    .from('profiles')
    .select(
      `id, email, full_name, traveller_type, is_admin, created_at,
       subscriptions(id, status, stripe_subscription_id, current_period_end, created_at, plans(name, slug))`
    )
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 300)

  const q = options?.query?.trim()
  if (q) {
    profileQuery = profileQuery.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
  }

  const { data, error } = await profileQuery
  if (error) throw new Error(error.message)

  const profiles = (data ?? []) as ProfileWithSubs[]
  const userIds = profiles.map((profile) => profile.id)

  const redemptionCounts = new Map<string, number>()
  const orderCounts = new Map<string, number>()

  if (userIds.length > 0) {
    const [{ data: redemptions }, { data: orders }] = await Promise.all([
      admin.from('redemptions').select('user_id').in('user_id', userIds),
      admin.from('order_vouchers').select('user_id').in('user_id', userIds),
    ])

    for (const row of redemptions ?? []) {
      redemptionCounts.set(row.user_id, (redemptionCounts.get(row.user_id) ?? 0) + 1)
    }
    for (const row of orders ?? []) {
      orderCounts.set(row.user_id, (orderCounts.get(row.user_id) ?? 0) + 1)
    }
  }

  let members = profiles.map((profile) => {
    const subscription = pickSubscription(profile.subscriptions)
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      traveller_type: profile.traveller_type,
      is_admin: profile.is_admin,
      created_at: profile.created_at,
      has_active_pass: isPassActive(subscription?.status),
      subscription,
      redemption_count: redemptionCounts.get(profile.id) ?? 0,
      order_count: orderCounts.get(profile.id) ?? 0,
    }
  })

  if (options?.passFilter === 'active') {
    members = members.filter((member) => member.has_active_pass)
  } else if (options?.passFilter === 'inactive') {
    members = members.filter((member) => !member.has_active_pass)
  }

  return members
}

export async function fetchAdminMemberStats(): Promise<{
  totalMembers: number
  activePasses: number
  admins: number
}> {
  const admin = createAdminClient()

  const [{ count: totalMembers }, { count: admins }, { data: activeSubs }] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
    admin
      .from('subscriptions')
      .select('user_id')
      .in('status', ['active', 'trialing']),
  ])

  const activePasses = new Set((activeSubs ?? []).map((row) => row.user_id)).size

  return {
    totalMembers: totalMembers ?? 0,
    activePasses,
    admins: admins ?? 0,
  }
}
