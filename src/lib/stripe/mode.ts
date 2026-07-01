export type StripeKeyMode = 'live' | 'test' | 'unknown'

export function getStripeKeyMode(secretKey?: string | null): StripeKeyMode {
  const key = secretKey ?? process.env.STRIPE_SECRET_KEY ?? ''
  if (key.startsWith('sk_live_')) return 'live'
  if (key.startsWith('sk_test_')) return 'test'
  return 'unknown'
}

export function getStripePublishableKeyMode(publishableKey?: string | null): StripeKeyMode {
  const key = publishableKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
  if (key.startsWith('pk_live_')) return 'live'
  if (key.startsWith('pk_test_')) return 'test'
  return 'unknown'
}

export function isStripeLiveMode(): boolean {
  return getStripeKeyMode() === 'live'
}

export function assertStripeKeysAligned(): void {
  const secretMode = getStripeKeyMode()
  const publishableMode = getStripePublishableKeyMode()

  if (secretMode !== 'unknown' && publishableMode !== 'unknown' && secretMode !== publishableMode) {
    console.error(
      `[Stripe] Key mode mismatch: secret=${secretMode}, publishable=${publishableMode}`
    )
  }

  if (process.env.VERCEL_ENV === 'production' && secretMode === 'test') {
    console.error(
      '[Stripe] Production is using TEST secret key — Trip Help charges will not be real money'
    )
  }
}
