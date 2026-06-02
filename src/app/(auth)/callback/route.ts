import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { sanitizeNextPath } from '@/lib/auth/helpers'

// Supabase OAuth callback + email confirmation links.
// Session cookies must be written onto the redirect response (not cookieStore alone).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeNextPath(searchParams.get('next'))
  // Stay on the same host the user signed in from (www vs apex) so session cookies apply.
  const redirectOrigin = origin

  if (!code) {
    return NextResponse.redirect(`${redirectOrigin}/login?error=auth_callback_error`)
  }

  const response = NextResponse.redirect(new URL(next, redirectOrigin))

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
    return NextResponse.redirect(`${redirectOrigin}/login?error=auth_callback_error`)
  }

  return response
}
