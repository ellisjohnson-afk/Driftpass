import { createAdminClient } from '@/lib/supabase/admin'
import type { CreditBalance } from '@/types'

// ============================================================
// DriftPass Credit Engine
// All credit operations go through here.
// Uses DB functions (deduct_credits, etc.) which are atomic.
// ============================================================

// Get current credit balance for a user
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const supabase = createAdminClient()

  const { data: balance } = await supabase.rpc('get_credit_balance', {
    p_user_id: userId,
  })

  // Get plan credits for this period
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, current_period_end, plans(credits_per_month)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const planCredits = (sub?.plans as { credits_per_month?: number } | null)?.credits_per_month ?? 0
  const remaining = balance ?? 0
  const used = planCredits - remaining

  return {
    total_credits: planCredits,
    used_credits: Math.max(0, used),
    remaining_credits: remaining,
    period_end: sub?.current_period_end ?? new Date().toISOString(),
  }
}

// Deduct credits for a redemption
// Returns new balance or throws on failure
export async function deductCredits(params: {
  userId: string
  subscriptionId: string
  amount: number
  description: string
  redemptionId?: string
}): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: params.userId,
    p_subscription_id: params.subscriptionId,
    p_amount: params.amount,
    p_description: params.description,
    p_redemption_id: params.redemptionId ?? null,
  })

  if (error) {
    if (error.message.includes('Insufficient credits')) {
      throw new InsufficientCreditsError(params.amount)
    }
    if (error.message.includes('No active subscription')) {
      throw new NoActiveSubscriptionError()
    }
    throw new Error(`Credit deduction failed: ${error.message}`)
  }

  return data as number
}

// Add topup credits
export async function addTopupCredits(params: {
  userId: string
  subscriptionId: string
  credits: number
  topupId: string
}): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('add_topup_credits', {
    p_user_id: params.userId,
    p_subscription_id: params.subscriptionId,
    p_amount: params.credits,
    p_topup_id: params.topupId,
  })

  if (error) throw new Error(`Topup failed: ${error.message}`)
  return data as number
}

// Get transaction history for a user (paginated)
export async function getCreditHistory(userId: string, limit = 20, offset = 0) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)
  return data
}

// ---- Custom Errors ----
export class InsufficientCreditsError extends Error {
  constructor(public readonly needed: number) {
    super(`Insufficient credits — need ${needed}`)
    this.name = 'InsufficientCreditsError'
  }
}

export class NoActiveSubscriptionError extends Error {
  constructor() {
    super('No active DriftPass subscription found')
    this.name = 'NoActiveSubscriptionError'
  }
}
