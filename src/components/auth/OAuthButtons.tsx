'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOAuthCallbackUrl, setAuthPostLoginCookie } from '@/lib/auth/helpers'
import { CANONICAL_APP_ORIGIN } from '@/lib/auth/canonical-url'

type OAuthProvider = 'google'

type OAuthButtonsProps = {
  next?: string
  disabled?: boolean
}

export function OAuthButtons({ next = '/account', disabled = false }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function signInWith(provider: OAuthProvider) {
    setLoadingProvider(provider)
    setError(null)

    setAuthPostLoginCookie(next)
    const redirectTo = getOAuthCallbackUrl()
    console.log('[OAuth] canonicalOrigin:', CANONICAL_APP_ORIGIN)
    console.log('[OAuth] postAuthNext (cookie):', next)
    console.log('[OAuth] redirectTo:', redirectTo)

    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setLoadingProvider(null)
    }
  }

  const isLoading = loadingProvider !== null

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2A2A2A]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#1A1A1A] px-2 text-[#6B7280]">or continue with</span>
        </div>
      </div>

      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => { void signInWith('google') }}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-[#2A2A2A] text-sm font-medium text-white hover:border-[#4A4A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'google' ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
