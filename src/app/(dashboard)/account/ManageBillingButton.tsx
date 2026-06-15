'use client'

import { useState } from 'react'

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openBillingPortal() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }

      if (data.url) {
        window.location.href = data.url
        return
      }

      setError(data.error ?? 'Could not open billing portal. Try again.')
    } catch {
      setError('Could not open billing portal. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={() => void openBillingPortal()}
        disabled={loading}
        className="w-full border border-[#2A2A2A] text-[#9CA3AF] py-2.5 rounded-lg text-sm hover:border-[#00FF7F] hover:text-white transition-colors disabled:opacity-50"
      >
        {loading ? 'Opening billing portal…' : 'Manage billing & cancel →'}
      </button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
