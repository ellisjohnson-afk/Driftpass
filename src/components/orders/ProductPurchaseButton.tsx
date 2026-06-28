'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { PurchasableProductType } from '@/lib/orders/types'

export interface ProductPurchaseButtonProps {
  productType: PurchasableProductType
  productSlug: string
  priceLabel: string
  className?: string
}

export function ProductPurchaseButton({
  productType,
  productSlug,
  priceLabel,
  className,
}: ProductPurchaseButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType, productSlug }),
      })
      const data = (await res.json()) as { url?: string; error?: string }

      if (data.url) {
        window.location.href = data.url
        return
      }

      setError(data.error ?? 'Could not start checkout')
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        onClick={() => void handlePurchase()}
        disabled={loading}
        className="flex w-full items-center justify-center rounded-2xl bg-drift-gold-gradient px-6 py-4 text-base font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105 disabled:opacity-60"
      >
        {loading ? 'Starting checkout…' : `Buy now · ${priceLabel}`}
      </button>
      {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
      <p className="text-center text-xs text-drift-text-muted">
        You&apos;ll get a collection PIN to show at the counter
      </p>
    </div>
  )
}
