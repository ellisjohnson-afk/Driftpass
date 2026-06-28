import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import {
  AUTH_POST_LOGIN_COOKIE,
  readAuthPostLoginCookie,
  resolveAuthNext,
} from '@/lib/auth/helpers'
import { appPathAt, appUrlAt } from '@/lib/auth/canonical-url'
import { getAppOriginFromRequest } from '@/lib/auth/app-origin'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncProfileFromUserMetadata } from '@/lib/auth/sync-profile-from-metadata'

// Supabase OAuth callback + email confirmation links.
// Session cookies must be written onto the redirect response (not cookieStore alone).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  const oauthErrorDescription = searchParams.get('error_description')
  const rawNext = searchParams.get('next')
  const rawPlan = searchParams.get('plan')
  const cookieDestination = readAuthPostLoginCookie(request.headers.get('cookie'))

  let destination = cookieDestination
    ? resolveAuthNext({ next: cookieDestination })
    : resolveAuthNext({ next: rawNext, plan: rawPlan })

  // Password recovery should always land on reset-password when next param says so
  if (rawNext === '/reset-password' || cookieDestination === '/reset-password') {
    destination = '/reset-password'
  }

  const appOrigin = getAppOriginFromRequest(request)

  if (oauthError) {
    console.error('[Auth callback] OAuth provider error:', oauthError, oauthErrorDescription)
    return NextResponse.redirect(
      appUrlAt(appOrigin, '/login', {
        error: 'auth_callback_error',
        error_detail: oauthErrorDescription ?? oauthError,
        next: rawNext ?? undefined,
        plan: rawPlan ?? undefined,
      })
    )
  }

  console.log('[Auth callback]', {
    rawNext,
    rawPlan,
    cookieDestination,
    destination,
    appOrigin,
  })

  if (!code) {
    console.error('[Auth callback] missing code param', request.nextUrl.toString())
    return NextResponse.redirect(
      appUrlAt(appOrigin, '/login', {
        error: 'auth_callback_error',
        error_detail: 'missing_code',
        next: rawNext ?? undefined,
        plan: rawPlan ?? undefined,
      })
    )
  }

  const response = NextResponse.redirect(appPathAt(appOrigin, destination))
  response.cookies.set(AUTH_POST_LOGIN_COOKIE, '', { path: '/', maxAge: 0 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[Auth callback] exchangeCodeForSession failed:', error.message)
    return NextResponse.redirect(
      appUrlAt(appOrigin, '/login', {
        error: 'auth_callback_error',
        error_detail: error.message,
        next: rawNext ?? undefined,
        plan: rawPlan ?? undefined,
      })
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    try {
      const admin = createAdminClient()
      await syncProfileFromUserMetadata(admin, user)
    } catch (syncError) {
      console.error('[Auth callback] profile metadata sync failed:', syncError)
    }
  }

  if (!cookieDestination && !rawNext) {
    const intendedNext = user?.user_metadata?.intended_next
    if (typeof intendedNext === 'string' && intendedNext.startsWith('/')) {
      destination = resolveAuthNext({ next: intendedNext })
      response.headers.set('Location', appPathAt(appOrigin, destination))
    }
  }

  return response
}
