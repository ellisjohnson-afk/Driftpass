'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
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

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { void handleLogin(e) }} className="space-y-4">
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
                autoComplete="current-password"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00FF7F] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00FF7F] text-[#0A0A0A] py-3 rounded-lg font-bold hover:bg-[#00E070] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Don&apos;t have a pass?{' '}
            <Link href="/signup" className="text-[#00FF7F] hover:underline">
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
