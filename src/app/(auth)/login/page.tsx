'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { resolveAuthNext, withTimeout } from '@/lib/auth/helpers'
import { confirmationRedirectUrl, formatSignInError, passwordRecoveryRedirectUrl } from '@/lib/auth/confirmation'

const SIGN_IN_TIMEOUT_MS = 20_000

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resetting, setResetting] = useState(false)
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const next = resolveAuthNext({
    next: searchParams.get('next'),
    plan,
  })
  const callbackError = searchParams.get('error')
  const callbackErrorDetail = searchParams.get('error_detail')
  const signupHref = plan
    ? `/signup?next=/checkout&plan=${plan}`
    : next !== '/account'
      ? `/signup?next=${encodeURIComponent(next)}`
      : '/signup'

  useEffect(() => {
    console.log('[Login] resolved postAuthNext:', next, {
      rawNext: searchParams.get('next'),
      rawPlan: searchParams.get('plan'),
    })
  }, [next, plan, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        SIGN_IN_TIMEOUT_MS,
        'Sign in timed out. Check your connection and try again.'
      )

      if (signInError) {
        setError(formatSignInError(signInError.message))
        setLoading(false)
        return
      }

      if (!data.session) {
        setError(
          'Sign in completed but no session was created. If you just signed up, confirm your email first.'
        )
        setLoading(false)
        return
      }

      window.location.assign(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError('Enter your email above, then resend the confirmation link.')
      return
    }

    setResending(true)
    setError(null)
    setInfo(null)

    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: confirmationRedirectUrl() },
    })

    setResending(false)

    if (resendError) {
      setError(resendError.message)
      return
    }

    setInfo('Confirmation email sent. Check your inbox and spam folder, then sign in.')
  }

  async function handleForgotPassword() {
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your email above, then use Forgot password.')
      return
    }

    setResetting(true)
    setError(null)
    setInfo(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: passwordRecoveryRedirectUrl(),
    })

    setResetting(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setInfo('Password reset email sent. Open the link, set a new password on the reset page, then sign in.')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-display text-2xl font-bold mb-8">
          <span className="text-white">Drift</span>
          <span className="text-[#00FF7F]">Pass</span>
        </Link>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-6">Welcome back</h1>

          {(error || callbackError) && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
              {error ??
                (callbackErrorDetail
                  ? `Sign in failed: ${callbackErrorDetail}`
                  : 'Sign in failed. Please try again.')}
            </div>
          )}

          {info && (
            <div className="rounded-lg border border-[#00FF7F]/30 bg-[#00FF7F]/10 px-4 py-3 text-sm text-[#00FF7F] mb-4">
              {info}
            </div>
          )}

          <OAuthButtons next={next} disabled={loading} />

          <form onSubmit={(e) => { void handleLogin(e) }} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00FF7F] transition-colors disabled:opacity-60"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm text-[#9CA3AF]">Password</label>
                <button
                  type="button"
                  onClick={() => { void handleForgotPassword() }}
                  disabled={loading || resetting}
                  className="text-xs text-[#00FF7F] hover:underline disabled:opacity-50"
                >
                  {resetting ? 'Sending…' : 'Forgot password?'}
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00FF7F] transition-colors disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00FF7F] text-[#0A0A0A] py-3 rounded-lg font-bold hover:bg-[#00E070] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign in with email'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { void handleResendConfirmation() }}
            disabled={loading || resending}
            className="mt-3 w-full rounded-lg border border-[#2A2A2A] py-2.5 text-sm text-[#9CA3AF] transition-colors hover:border-[#00FF7F]/40 hover:text-white disabled:opacity-50"
          >
            {resending ? 'Sending confirmation…' : 'Resend confirmation email'}
          </button>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Don&apos;t have a pass?{' '}
            <Link href={signupHref} className="text-[#00FF7F] hover:underline">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
