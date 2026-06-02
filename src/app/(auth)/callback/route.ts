import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { resolveAuthNext } from '@/lib/auth/helpers'
import { canonicalAppUrl } from '@/lib/auth/canonical-url'

// Supabase OAuth callback + email confirmation links.
// Session cookies must be written onto the redirect response (not cookieStore alone).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = resolveAuthNext({
    next: searchParams.get('next'),
    plan: searchParams.get('plan'),
  })

  if (!code) {
    return NextResponse.redirect(
      canonicalAppUrl('/login', { error: 'auth_callback_error', next })
    )
  }

  const response = NextResponse.redirect(canonicalAppUrl(next))

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
      canonicalAppUrl('/login', { error: 'auth_callback_error', next })
    )
  }

  return response
}
