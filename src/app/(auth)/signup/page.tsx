'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { resolveAuthNext, sanitizePlanSlug, buildPricingCheckoutPath } from '@/lib/auth/helpers'
import { confirmationRedirectUrl, isDuplicateSignupUser } from '@/lib/auth/confirmation'
import { cn } from '@/lib/utils/cn'

function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [travellerType, setTravellerType] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false)
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = sanitizePlanSlug(searchParams.get('plan')) ?? 'membership'
  const postAuthNext = resolveAuthNext({
    next: searchParams.get('next'),
    plan,
  })
  const loginHref = `/login?next=/pricing&plan=${plan}`

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!signUpData.session) {
      setAccountAlreadyExists(isDuplicateSignupUser(signUpData.user))
      setAwaitingEmailConfirm(true)
      setLoading(false)
      return
    }

    if (travellerType) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ traveller_type: travellerType }).eq('id', user.id)
      }
    }

    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planSlug: plan }),
    })

    const data = (await res.json()) as { url?: string; error?: string }

    if (data.url) {
      window.location.href = data.url
    } else {
      router.push(buildPricingCheckoutPath(plan))
    }
  }

  async function handleResendConfirmation() {
    if (!email) return

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

    setInfo('Confirmation email sent. Check your inbox and spam folder.')
  }

  const travellerTypes = [
    { value: 'backpacker', label: '🎒 Backpacker' },
    { value: 'digital_nomad', label: '💻 Digital Nomad' },
    { value: 'van_lifer', label: '🚐 Van Lifer' },
  ]

  return (
    <AuthShell>
      <AuthCard
        title="Create your pass"
        subtitle={`Starting with the ${plan} plan · $7.99/week`}
      >
        {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
        {info ? <AuthAlert tone="success">{info}</AuthAlert> : null}

        {awaitingEmailConfirm ? (
          <div className="space-y-4">
            <AuthAlert tone="success">
              {accountAlreadyExists
                ? 'An account with this email already exists but is not confirmed yet. Resend the confirmation email, then sign in.'
                : 'Check your email to confirm your account, then sign in to start your membership.'}
            </AuthAlert>
            <AuthSecondaryButton
              type="button"
              onClick={() => {
                void handleResendConfirmation()
              }}
              disabled={resending}
            >
              {resending ? 'Sending…' : 'Resend confirmation email'}
            </AuthSecondaryButton>
            <Link
              href={loginHref}
              className="block w-full rounded-2xl bg-drift-gold-gradient py-3 text-center text-sm font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <OAuthButtons next={postAuthNext} disabled={loading} />

            <form
              onSubmit={(e) => {
                void handleSignup(e)
              }}
              className="mt-4 space-y-4"
            >
              <AuthInput
                label="Your name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Alex"
              />

              <AuthInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@email.com"
              />

              <AuthInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min 8 characters"
              />

              <div>
                <label className="mb-2 block text-sm text-drift-text-muted">I travel as…</label>
                <div className="grid grid-cols-3 gap-2">
                  {travellerTypes.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTravellerType(value)}
                      className={cn(
                        'rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors',
                        travellerType === value
                          ? 'border-drift-gold-to/50 bg-drift-gold-gradient/15 text-drift-gold-mid'
                          : 'border-drift-border text-drift-text-muted hover:border-drift-gold-to/30 hover:text-white'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <AuthPrimaryButton type="submit" disabled={loading} loading={loading} className="mt-2">
                {loading ? 'Setting up your pass…' : 'Continue to payment →'}
              </AuthPrimaryButton>
            </form>
          </>
        )}

        {!awaitingEmailConfirm ? (
          <>
            <p className="mt-4 text-center text-xs text-drift-text-muted">
              By signing up you agree to our{' '}
              <Link href="/terms" className="underline hover:text-white">
                Terms
              </Link>
            </p>
            <p className="mt-4 text-center text-sm text-drift-text-muted">
              Already have a pass? <AuthLink href={loginHref}>Sign in</AuthLink>
            </p>
          </>
        ) : null}
      </AuthCard>
    </AuthShell>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
