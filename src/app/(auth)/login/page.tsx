'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { resolveAuthNext, withTimeout } from '@/lib/auth/helpers'

const SIGN_IN_TIMEOUT_MS = 20_000

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const next = resolveAuthNext({
    next: searchParams.get('next'),
    plan,
  })
  const callbackError = searchParams.get('error')
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
        supabase.auth.signInWithPassword({ email, password }),
        SIGN_IN_TIMEOUT_MS,
        'Sign in timed out. Check your connection and try again.'
      )

      if (signInError) {
        setError(signInError.message)
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
              {error ?? 'Sign in failed. Please try again.'}
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
              <label className="block text-sm text-[#9CA3AF] mb-1.5">Password</label>
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
