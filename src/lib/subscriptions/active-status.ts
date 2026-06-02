/** Subscription statuses that grant pass access (matches product rules, not only Stripe "active"). */
export const PASS_ACTIVE_STATUSES = ['active', 'trialing'] as const

export function isPassActive(status: string | null | undefined): boolean {
  return status != null && (PASS_ACTIVE_STATUSES as readonly string[]).includes(status)
}
