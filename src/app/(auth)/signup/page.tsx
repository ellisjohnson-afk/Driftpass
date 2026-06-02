'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [travellerType, setTravellerType] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? 'explorer'

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
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
      router.push('/dashboard')
    }
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

          <OAuthButtons next="/pricing" disabled={loading} />

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

          <p className="text-center text-xs text-[#6B7280] mt-4">
            By signing up you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link>
          </p>

          <p className="text-center text-sm text-[#6B7280] mt-4">
            Already have a pass?{' '}
            <Link href="/login" className="text-[#00FF7F] hover:underline">
              Sign in
            </Link>
          </p>
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
