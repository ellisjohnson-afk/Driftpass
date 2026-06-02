import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import {
  AUTH_POST_LOGIN_COOKIE,
  readAuthPostLoginCookie,
  resolveAuthNext,
} from '@/lib/auth/helpers'
import { canonicalAppPath, canonicalAppUrl } from '@/lib/auth/canonical-url'

// Supabase OAuth callback + email confirmation links.
// Session cookies must be written onto the redirect response (not cookieStore alone).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next')
  const rawPlan = searchParams.get('plan')
  const cookieDestination = readAuthPostLoginCookie(request.headers.get('cookie'))

  let destination = cookieDestination
    ? resolveAuthNext({ next: cookieDestination })
    : resolveAuthNext({ next: rawNext, plan: rawPlan })

  const finalRedirect = canonicalAppPath(destination)
  console.log('[Auth callback]', {
    rawNext,
    rawPlan,
    cookieDestination,
    destination,
    finalRedirect,
  })

  if (!code) {
    return NextResponse.redirect(
      canonicalAppUrl('/login', { error: 'auth_callback_error', next: rawNext ?? undefined, plan: rawPlan ?? undefined })
    )
  }

  const response = NextResponse.redirect(finalRedirect)
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
      canonicalAppUrl('/login', { error: 'auth_callback_error', next: rawNext ?? undefined, plan: rawPlan ?? undefined })
    )
  }

  return response
}
