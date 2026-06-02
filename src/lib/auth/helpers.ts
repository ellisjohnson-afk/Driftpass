import { PLAN_BY_SLUG } from '@/constants/plans'
import { canonicalAppUrl } from '@/lib/auth/canonical-url'

export function sanitizeNextPath(next: string | null | undefined, fallback = '/account'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback
  }
  return next
}

export function sanitizePlanSlug(plan: string | null | undefined): string | null {
  if (!plan || !(plan in PLAN_BY_SLUG)) {
    return null
  }
  return plan
}

/** Post-auth destination to resume plan selection / Stripe checkout. */
export function buildPricingCheckoutPath(plan?: string | null): string {
  const safePlan = sanitizePlanSlug(plan)
  return safePlan ? `/pricing?plan=${safePlan}` : '/pricing'
}

/** Merge login/signup `next` + `plan` into one safe redirect path. */
export function resolveAuthNext(params: {
  next?: string | null
  plan?: string | null
}): string {
  const plan = sanitizePlanSlug(params.plan)
  const rawNext = params.next

  if (rawNext === '/checkout') {
    return buildPricingCheckoutPath(plan)
  }

  if (rawNext) {
    const path = sanitizeNextPath(rawNext, '/account')
    if (path.startsWith('/pricing') && plan) {
      return buildPricingCheckoutPath(plan)
    }
    return path
  }

  if (plan) {
    return buildPricingCheckoutPath(plan)
  }

  return '/account'
}

export function getOAuthCallbackUrl(next: string): string {
  const safeNext = sanitizeNextPath(next, '/account')
  return canonicalAppUrl('/callback', { next: safeNext })
}

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}
