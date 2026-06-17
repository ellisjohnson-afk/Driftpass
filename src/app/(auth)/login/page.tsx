'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import {
  AuthAlert,
  AuthCard,
  AuthInput,
  AuthLink,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthShell,
} from '@/components/auth/AuthShell'
import { resolveAuthNext, withTimeout, setAuthPostLoginCookie } from '@/lib/auth/helpers'
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
    setAuthPostLoginCookie('/reset-password')
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
    <AuthShell>
      <AuthCard title="Welcome back" subtitle="Sign in to open your pass and member deals.">
        {(error || callbackError) && (
          <AuthAlert tone="error">
            {error ??
              (callbackErrorDetail
                ? `Sign in failed: ${callbackErrorDetail}`
                : 'Sign in failed. Please try again.')}
          </AuthAlert>
        )}

        {info ? <AuthAlert tone="success">{info}</AuthAlert> : null}

        <OAuthButtons next={next} disabled={loading} />

        <form
          onSubmit={(e) => {
            void handleLogin(e)
          }}
          className="mt-4 space-y-4"
        >
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            placeholder="you@email.com"
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm text-drift-text-muted">Password</label>
              <button
                type="button"
                onClick={() => {
                  void handleForgotPassword()
                }}
                disabled={loading || resetting}
                className="text-xs font-semibold text-drift-gold-mid hover:text-white disabled:opacity-50"
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
              placeholder="••••••••"
              className="w-full rounded-xl border border-drift-border bg-drift-navy-deep px-4 py-3 text-white placeholder:text-drift-text-subtle transition-colors focus:border-drift-gold-to/50 focus:outline-none disabled:opacity-60"
            />
          </div>

          <AuthPrimaryButton type="submit" disabled={loading} loading={loading}>
            {loading ? 'Signing in…' : 'Sign in with email'}
          </AuthPrimaryButton>
        </form>

        <AuthSecondaryButton
          type="button"
          onClick={() => {
            void handleResendConfirmation()
          }}
          disabled={loading || resending}
          className="mt-3"
        >
          {resending ? 'Sending confirmation…' : 'Resend confirmation email'}
        </AuthSecondaryButton>

        <p className="mt-6 text-center text-sm text-drift-text-muted">
          Don&apos;t have a pass? <AuthLink href={signupHref}>Get started</AuthLink>
        </p>
      </AuthCard>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
