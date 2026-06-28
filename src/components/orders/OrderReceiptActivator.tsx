'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const MAX_ATTEMPTS = 6
const RETRY_MS = 1500

export function OrderReceiptActivator() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!sessionId || !sessionId.startsWith('cs_')) {
      router.replace('/trip-help/orders')
      return
    }

    let cancelled = false

    async function fulfill(tryNum: number) {
      if (cancelled) return

      setAttempt(tryNum)

      try {
        const res = await fetch('/api/orders/fulfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        const body = (await res.json()) as { data?: { id: string }; error?: string }

        if (res.ok && body.data?.id) {
          router.replace(`/trip-help/orders/${body.data.id}`)
          return
        }

        const retryable =
          res.status === 500 &&
          (body.error?.toLowerCase().includes('not paid') ||
            body.error?.toLowerCase().includes('load checkout'))

        if (retryable && tryNum < MAX_ATTEMPTS) {
          window.setTimeout(() => void fulfill(tryNum + 1), RETRY_MS)
          return
        }

        setError(body.error ?? 'Could not load your receipt. Your payment may still have gone through.')
      } catch {
        if (tryNum < MAX_ATTEMPTS) {
          window.setTimeout(() => void fulfill(tryNum + 1), RETRY_MS)
          return
        }
        setError('Network error while loading your receipt.')
      }
    }

    void fulfill(1)

    return () => {
      cancelled = true
    }
  }, [router, sessionId])

  if (error) {
    return (
      <div className="animate-fade-in space-y-4 rounded-2xl border border-amber-800/50 bg-amber-900/20 px-6 py-8 text-center">
        <h1 className="text-lg font-bold text-amber-200">Receipt not ready yet</h1>
        <p className="text-sm text-amber-300/90">{error}</p>
        <p className="text-xs text-amber-300/70">
          If you were charged, open My purchases in a minute or contact support with your payment confirmation.
        </p>
        <Link
          href="/trip-help/orders"
          className="inline-flex rounded-2xl bg-drift-gold-gradient px-5 py-2.5 text-sm font-bold text-drift-navy-deep"
        >
          My purchases
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4 rounded-2xl border border-drift-border/60 bg-drift-navy-light px-6 py-10 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-drift-gold-mid border-t-transparent" />
      <h1 className="text-lg font-bold">Preparing your receipt…</h1>
      <p className="text-sm text-drift-text-muted">
        Generating your collection PIN
        {attempt > 1 ? ` (try ${attempt}/${MAX_ATTEMPTS})` : ''}
      </p>
    </div>
  )
}
