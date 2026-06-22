'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  AuthAlert,
  AuthCard,
  AuthInput,
  AuthLink,
  AuthPrimaryButton,
  AuthShell,
} from '@/components/auth/AuthShell'
import { passwordRecoveryRedirectUrl } from '@/lib/auth/confirmation'
import { setAuthPostLoginCookie } from '@/lib/auth/helpers'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter the email address for your account.')
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)

    const supabase = createClient()
    setAuthPostLoginCookie('/reset-password')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: passwordRecoveryRedirectUrl(),
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
    setInfo(
      `If an account exists for ${trimmed}, we sent a reset link. Check your inbox and spam folder — look for mail from hello@driftpass.com.au.`
    )
  }

  return (
    <AuthShell>
      <AuthCard
        title="Forgot password?"
        subtitle="Enter your email and we will send you a link to set a new password."
      >
        {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
        {info ? <AuthAlert tone="success">{info}</AuthAlert> : null}

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-drift-text-muted">
              The link opens a page where you can choose a new password, then sign in as usual.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-2xl bg-drift-gold-gradient py-3 text-center text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
            >
              Back to sign in
            </Link>
            <button
              type="button"
              onClick={() => {
                setSent(false)
                setInfo(null)
              }}
              className="w-full text-center text-sm text-drift-gold-mid hover:text-white"
            >
              Send another email
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
            className="space-y-4"
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

            <AuthPrimaryButton type="submit" disabled={loading} loading={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </AuthPrimaryButton>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-drift-text-muted">
          Remember your password? <AuthLink href="/login">Sign in</AuthLink>
        </p>
      </AuthCard>
    </AuthShell>
  )
}
