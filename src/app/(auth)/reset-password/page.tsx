'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
      } else {
        setError('Use Forgot password on the login page to get a reset link, then open it from your email.')
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
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-display text-2xl font-bold mb-8">
          <span className="text-white">Drift</span>
          <span className="text-[#00FF7F]">Pass</span>
        </Link>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-2">Set a new password</h1>
          <p className="text-sm text-[#9CA3AF] mb-6">
            Choose a password for email sign-in.
          </p>

          {bootstrapping && (
            <p className="text-sm text-[#9CA3AF] mb-4">Verifying your reset link…</p>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!ready || bootstrapping}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00FF7F] transition-colors disabled:opacity-60"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9CA3AF] mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!ready || bootstrapping}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00FF7F] transition-colors disabled:opacity-60"
                placeholder="Repeat password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !ready || bootstrapping}
              className="w-full bg-[#00FF7F] text-[#0A0A0A] py-3 rounded-lg font-bold hover:bg-[#00E070] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save password'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            <Link href="/login?next=/pricing&plan=membership" className="text-[#00FF7F] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
