import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { isPassActive } from '@/lib/subscriptions/active-status'
import { getPurchasableMarketplaceProduct } from '@/lib/orders/catalog'
import { TRIP_MARKETPLACE } from '@/lib/trip-help/constants'
import { ProductPurchaseButton } from '@/components/orders'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MarketplacePurchasePage({
  params,
}: {
  params: { slug: string }
}) {
  const item = TRIP_MARKETPLACE.find((entry) => entry.slug === params.slug)
  const product = getPurchasableMarketplaceProduct(params.slug)

  if (!item || !product) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()
  if (!user) redirect(appUrlAt(appOrigin, '/login', { next: `/trip-help/marketplace/${params.slug}` }))

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub || !isPassActive(sub.status)) {
    redirect(appUrlAt(appOrigin, '/pricing'))
  }

  return (
    <div className="animate-fade-in space-y-6 pb-4">
      <Link href="/trip-help" className="text-sm text-drift-gold-mid hover:text-white">
        ← Trip Help
      </Link>

      <div className="rounded-3xl border border-drift-border/60 bg-drift-navy-light p-6">
        <span className="text-3xl" aria-hidden>
          {item.emoji}
        </span>
        <h1 className="mt-4 text-2xl font-bold">{item.title}</h1>
        <p className="mt-2 text-sm text-drift-text-muted">{item.description}</p>
        <p className="mt-4 text-3xl font-bold text-drift-gold-mid">{item.priceLabel}</p>

        <ProductPurchaseButton
          productType="marketplace"
          productSlug={item.slug}
          priceLabel={item.priceLabel}
          className="mt-6"
        />
      </div>
    </div>
  )
}
