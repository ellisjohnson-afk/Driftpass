'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { resolveAuthNext, sanitizePlanSlug, buildPricingCheckoutPath } from '@/lib/auth/helpers'
import {
  confirmationRedirectUrl,
  isDuplicateSignupUser,
} from '@/lib/auth/confirmation'

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

    // Update traveller type on profile (created by trigger)
    if (travellerType) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ traveller_type: travellerType })
          .eq('id', user.id)
      }
    }

    // Redirect to subscription checkout
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planSlug: plan }),
    })

    const data = await res.json() as { url?: string; error?: string }

    if (data.url) {
      window.location.href = data.url  // Stripe Checkout
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
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-display text-2xl font-bold mb-8">
          <span className="text-white">Drift</span>
          <span className="text-[#00FF7F]">Pass</span>
        </Link>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-2">Create your pass</h1>
          <p className="text-sm text-[#9CA3AF] mb-6">
            Starting with the <span className="text-white capitalize">{plan}</span> plan
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {info && (
            <div className="rounded-lg border border-[#00FF7F]/30 bg-[#00FF7F]/10 px-4 py-3 text-sm text-[#00FF7F] mb-4">
              {info}
            </div>
          )}

          {awaitingEmailConfirm ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#00FF7F]/30 bg-[#00FF7F]/10 px-4 py-3 text-sm text-[#00FF7F]">
                {accountAlreadyExists
                  ? 'An account with this email already exists but is not confirmed yet. Resend the confirmation email, then sign in.'
                  : 'Check your email to confirm your account, then sign in to start your membership.'}
              </div>
              <button
                type="button"
                onClick={() => { void handleResendConfirmation() }}
                disabled={resending}
                className="block w-full rounded-lg border border-[#2A2A2A] py-3 text-sm font-medium text-[#9CA3AF] transition-colors hover:border-[#00FF7F]/40 hover:text-white disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend confirmation email'}
              </button>
              <Link
                href={loginHref}
                className="block w-full rounded-lg bg-[#00FF7F] py-3 text-center font-bold text-[#0A0A0A] hover:bg-[#00E070] transition-colors"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
          <>
          <OAuthButtons next={postAuthNext} disabled={loading} />

          <form onSubmit={(e) => { void handleSignup(e) }} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00FF7F] transition-colors"
                placeholder="Alex"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00FF7F] transition-colors"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00FF7F] transition-colors"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9CA3AF] mb-2">I travel as...</label>
              <div className="grid grid-cols-3 gap-2">
                {travellerTypes.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTravellerType(value)}
                    className={`py-2.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      travellerType === value
                        ? 'border-[#00FF7F] bg-[#00FF7F]/10 text-[#00FF7F]'
                        : 'border-[#2A2A2A] text-[#9CA3AF] hover:border-[#4A4A4A]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00FF7F] text-[#0A0A0A] py-3 rounded-lg font-bold hover:bg-[#00E070] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Setting up your pass...' : 'Continue to payment with email →'}
            </button>
          </form>
          </>
          )}

          {!awaitingEmailConfirm && (
          <p className="text-center text-xs text-[#6B7280] mt-4">
            By signing up you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link>
          </p>
          )}

          {!awaitingEmailConfirm && (
          <p className="text-center text-sm text-[#6B7280] mt-4">
            Already have a pass?{' '}
            <Link href={loginHref} className="text-[#00FF7F] hover:underline">
              Sign in
            </Link>
          </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
