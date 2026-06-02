import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// ============================================================
// DriftPass Middleware
// 1. Refreshes Supabase auth sessions on every request
// 2. Guards protected routes (dashboard, partner portal)
// ============================================================

const PROTECTED_ROUTES = ['/dashboard', '/account', '/pass']
const PARTNER_ROUTES: string[] = []  // /portal not yet built; /scan is public (PIN-based, no login needed)
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

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
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — MUST be called before any other operation
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Guard dashboard routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Guard partner routes
  if (PARTNER_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check partner_user record (lightweight check)
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!partnerUser) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
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
