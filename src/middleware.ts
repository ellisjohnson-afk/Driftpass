import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import {
  appPathAt,
  appUrlAt,
  canonicalAppUrl,
  isCanonicalProductionHost,
  toCanonicalProductionUrl,
} from '@/lib/auth/canonical-url'
import { getAppOriginFromRequest } from '@/lib/auth/app-origin'
import { buildLoginReturnUrl, resolveAuthNext, readAuthPostLoginCookie } from '@/lib/auth/helpers'

// ============================================================
// DriftPass Middleware
// 1. Refreshes Supabase auth sessions on every request
// 2. Guards protected routes (dashboard, partner portal)
// ============================================================

const PROTECTED_ROUTES = ['/dashboard', '/account', '/pass', '/design-preview']
const PARTNER_ROUTES: string[] = []  // /portal not yet built; /scan is public (PIN-based, no login needed)
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get('host') ?? ''
  const appOrigin = getAppOriginFromRequest(request)

  // Supabase auth errors often land on Site URL (/) — send to login with a readable message
  if (pathname === '/' && request.nextUrl.searchParams.has('error')) {
    const errorCode = request.nextUrl.searchParams.get('error_code')
    const errorDescription = request.nextUrl.searchParams.get('error_description')
    const detail =
      errorCode === 'otp_expired'
        ? 'This link has expired. Request a new password reset from the login page.'
        : (errorDescription ?? request.nextUrl.searchParams.get('error') ?? 'auth_callback_error')
    return NextResponse.redirect(
      appUrlAt(appOrigin, '/login', {
        error: 'auth_callback_error',
        error_detail: detail,
        next: '/pricing',
        plan: 'membership',
      })
    )
  }

  // Supabase may fall back to Site URL — forward /?code=... to /callback?code=...
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const callbackUrl = new URL('/callback', getAppOriginFromRequest(request))
    request.nextUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value)
    })
    const postLogin = readAuthPostLoginCookie(
      request.cookies
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; ')
    )
    if (postLogin && !callbackUrl.searchParams.has('next')) {
      callbackUrl.searchParams.set('next', postLogin.startsWith('/') ? postLogin : `/${postLogin}`)
    }
    console.log('[Middleware] forwarding Site URL OAuth code to callback:', callbackUrl.toString())
    return NextResponse.redirect(callbackUrl.toString(), 307)
  }

  // Recovery link may land on /reset-password?code=... — route through callback with next preserved
  if (pathname === '/reset-password' && request.nextUrl.searchParams.has('code')) {
    const callbackUrl = new URL('/callback', getAppOriginFromRequest(request))
    request.nextUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value)
    })
    if (!callbackUrl.searchParams.has('next')) {
      callbackUrl.searchParams.set('next', '/reset-password')
    }
    return NextResponse.redirect(callbackUrl.toString(), 307)
  }

  // OAuth PKCE state is host-bound — never serve auth on driftpass.vercel.app or apex.
  if (!isCanonicalProductionHost(host)) {
    const destination = toCanonicalProductionUrl(pathname, search)
    console.log('[Middleware] non-canonical host redirect:', { host, destination })
    return NextResponse.redirect(destination, 308)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  let response = NextResponse.next({ request: { headers: requestHeaders } })

  // Create Supabase client that can update session cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — MUST be called before any other operation
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect authenticated users away from auth pages — preserve purchase intent
  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const destination = resolveAuthNext({
      next: request.nextUrl.searchParams.get('next'),
      plan: request.nextUrl.searchParams.get('plan'),
    })
    console.log('[Middleware] logged-in auth-page redirect:', {
      pathname,
      rawNext: request.nextUrl.searchParams.get('next'),
      rawPlan: request.nextUrl.searchParams.get('plan'),
      destination,
      appOrigin,
    })
    return NextResponse.redirect(appPathAt(appOrigin, destination))
  }

  // Guard dashboard routes — preserve path + query (e.g. /pricing?plan=explorer)
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const returnTo = pathname + search
      return NextResponse.redirect(buildLoginReturnUrl(returnTo, appOrigin))
    }
  }

  // Guard partner routes
  if (PARTNER_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const returnTo = pathname + search
      return NextResponse.redirect(buildLoginReturnUrl(returnTo, appOrigin))
    }

    // Check partner_user record (lightweight check)
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!partnerUser) {
      return NextResponse.redirect(appUrlAt(appOrigin, '/dashboard'))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files, API, and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
