import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { canonicalAppUrl } from '@/lib/auth/canonical-url'
import { resolveAuthNext } from '@/lib/auth/helpers'

// ============================================================
// DriftPass Middleware
// 1. Refreshes Supabase auth sessions on every request
// 2. Guards protected routes (dashboard, partner portal)
// ============================================================

const PROTECTED_ROUTES = ['/dashboard', '/account', '/pass', '/pricing']
const PARTNER_ROUTES: string[] = []  // /portal not yet built; /scan is public (PIN-based, no login needed)
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
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
    return NextResponse.redirect(canonicalAppUrl(destination))
  }

  // Guard dashboard routes — preserve path + query (e.g. /pricing?plan=explorer)
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const returnTo = pathname + search
      return NextResponse.redirect(canonicalAppUrl('/login', { next: returnTo }))
    }
  }

  // Guard partner routes
  if (PARTNER_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const returnTo = pathname + search
      return NextResponse.redirect(canonicalAppUrl('/login', { next: returnTo }))
    }

    // Check partner_user record (lightweight check)
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!partnerUser) {
      return NextResponse.redirect(canonicalAppUrl('/dashboard'))
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
