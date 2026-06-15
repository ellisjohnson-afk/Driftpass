import { PLAN_BY_SLUG } from '@/constants/plans'
import { CANONICAL_APP_ORIGIN, appUrlAt } from '@/lib/auth/canonical-url'
import { getClientAppOrigin } from '@/lib/auth/app-origin'

export const AUTH_POST_LOGIN_COOKIE = 'auth_post_login'

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

/** Split "/pricing?plan=explorer" into path + plan for flat OAuth callback query params. */
export function splitPostAuthDestination(destination: string): { next: string; plan: string | null } {
  const parsed = new URL(destination.startsWith('/') ? destination : `/${destination}`, 'http://local')
  return {
    next: sanitizeNextPath(parsed.pathname, '/account'),
    plan: sanitizePlanSlug(parsed.searchParams.get('plan')),
  }
}

/** Merge login/signup `next` + `plan` into one safe redirect path. */
export function resolveAuthNext(params: {
  next?: string | null
  plan?: string | null
}): string {
  const explicitPlan = sanitizePlanSlug(params.plan)
  const rawNext = params.next

  if (rawNext === '/checkout') {
    return buildPricingCheckoutPath(explicitPlan)
  }

  if (rawNext) {
    if (rawNext.includes('?')) {
      const parsed = new URL(rawNext, 'http://local')
      const path = sanitizeNextPath(parsed.pathname, '/account')
      const embeddedPlan = sanitizePlanSlug(parsed.searchParams.get('plan'))
      const plan = explicitPlan ?? embeddedPlan
      if (path.startsWith('/pricing') && plan) {
        return buildPricingCheckoutPath(plan)
      }
      return `${path}${parsed.search}`
    }

    const path = sanitizeNextPath(rawNext, '/account')
    if (path.startsWith('/pricing') && explicitPlan) {
      return buildPricingCheckoutPath(explicitPlan)
    }
    return path
  }

  if (explicitPlan) {
    return buildPricingCheckoutPath(explicitPlan)
  }

  return '/account'
}

/** Supabase Redirect URLs must match exactly — no query params on redirectTo. Post-auth path is stored in auth_post_login cookie. */
export function getOAuthCallbackUrl(): string {
  if (typeof window !== 'undefined') {
    return `${getClientAppOrigin()}/callback`
  }
  return appUrlAt(CANONICAL_APP_ORIGIN, '/callback')
}

export function setAuthPostLoginCookie(destination: string): void {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${AUTH_POST_LOGIN_COOKIE}=${encodeURIComponent(destination)}; path=/; max-age=600; SameSite=Lax${secure}`
}

export function readAuthPostLoginCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|; )${AUTH_POST_LOGIN_COOKIE}=([^;]*)`))
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

export function buildLoginReturnUrl(returnTo: string, origin?: string): string {
  const { next, plan } = splitPostAuthDestination(returnTo)
  return appUrlAt(origin ?? CANONICAL_APP_ORIGIN, '/login', {
    next,
    ...(plan ? { plan } : {}),
  })
}

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}
