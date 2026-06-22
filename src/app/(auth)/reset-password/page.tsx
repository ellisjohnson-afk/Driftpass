'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  AuthAlert,
  AuthCard,
  AuthInput,
  AuthLink,
  AuthPrimaryButton,
  AuthShell,
} from '@/components/auth/AuthShell'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function bootstrapSession() {
      const supabase = createClient()
      const code = searchParams.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setError(exchangeError.message)
          setBootstrapping(false)
          return
        }
        window.history.replaceState({}, '', '/reset-password')
        setReady(true)
        setBootstrapping(false)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
      } else {
        setError('Use the forgot password page to get a reset link, then open it from your email.')
      }
      setBootstrapping(false)
    }

    void bootstrapSession()
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!ready) {
      setError('Your reset link has expired. Request a new one from the login page.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push('/pricing')
  }

  return (
    <AuthShell>
      <AuthCard title="Set a new password" subtitle="Choose a password for email sign-in.">
        {bootstrapping ? (
          <AuthAlert tone="info">Verifying your reset link…</AuthAlert>
        ) : null}

        {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

        <form
          onSubmit={(e) => {
            void handleSubmit(e)
          }}
          className="space-y-4"
        >
          <AuthInput
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={!ready || bootstrapping}
            placeholder="Min 8 characters"
          />

          <AuthInput
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={!ready || bootstrapping}
            placeholder="Repeat password"
          />

          <AuthPrimaryButton
            type="submit"
            disabled={loading || !ready || bootstrapping}
            loading={loading}
          >
            {loading ? 'Saving…' : 'Save password'}
          </AuthPrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-drift-text-muted">
          <AuthLink href="/login?next=/pricing&plan=membership">Back to sign in</AuthLink>
        </p>
      </AuthCard>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
