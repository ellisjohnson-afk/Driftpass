import { getPurchasableMarketplaceProduct, getPurchasableTripHelpProduct } from '@/lib/orders/catalog'
import { TRIP_MARKETPLACE, TRIP_UTILITIES } from '@/lib/trip-help/constants'
import { TRIP_TOURS } from '@/lib/trip-help/tours'

export interface PartnerCatalogProduct {
  type: 'trip_help' | 'marketplace'
  slug: string
  name: string
  priceAudCents: number
}

export interface PartnerOnboardingChecklist {
  profileComplete: boolean
  isActive: boolean
  isVerified: boolean
  hasActiveService: boolean
  hasPayoutConfigured: boolean
  catalogProducts: PartnerCatalogProduct[]
  scanUrl: string
  perksUrl: string
  readyToLaunch: boolean
}

type PartnerInput = {
  slug: string
  name: string
  address: string
  is_active: boolean
  is_verified: boolean
  partner_services: Array<{
    is_active: boolean
    aud_payout_cents: number
  }>
}

const PRODUCTION_ORIGIN = 'https://www.driftpass.com.au'

export function getCatalogProductsForPartner(partnerSlug: string): PartnerCatalogProduct[] {
  const products: PartnerCatalogProduct[] = []

  for (const utility of TRIP_UTILITIES) {
    if (utility.partnerSlug !== partnerSlug) continue
    const product = getPurchasableTripHelpProduct(utility.slug)
    if (!product) continue
    products.push({
      type: 'trip_help',
      slug: product.slug,
      name: product.name,
      priceAudCents: product.priceAudCents,
    })
  }

  const marketplaceSlugs = Array.from(
    new Set([
      ...TRIP_MARKETPLACE.map((item) => item.slug),
      ...TRIP_TOURS.map((tour) => tour.slug),
    ])
  )

  for (const slug of marketplaceSlugs) {
    const product = getPurchasableMarketplaceProduct(slug)
    if (!product || product.partnerSlug !== partnerSlug) continue
    products.push({
      type: 'marketplace',
      slug: product.slug,
      name: product.name,
      priceAudCents: product.priceAudCents,
    })
  }

  return products
}

export function buildPartnerOnboardingChecklist(partner: PartnerInput): PartnerOnboardingChecklist {
  const activeServices = partner.partner_services.filter((service) => service.is_active)
  const hasPayoutConfigured = activeServices.some((service) => service.aud_payout_cents > 0)
  const profileComplete = Boolean(partner.name.trim() && partner.address.trim() && partner.slug.trim())
  const catalogProducts = getCatalogProductsForPartner(partner.slug)

  const readyToLaunch =
    profileComplete &&
    partner.is_active &&
    activeServices.length > 0 &&
    hasPayoutConfigured &&
    catalogProducts.length > 0

  return {
    profileComplete,
    isActive: partner.is_active,
    isVerified: partner.is_verified,
    hasActiveService: activeServices.length > 0,
    hasPayoutConfigured,
    catalogProducts,
    scanUrl: `${PRODUCTION_ORIGIN}/scan`,
    perksUrl: `${PRODUCTION_ORIGIN}/perks/${partner.slug}`,
    readyToLaunch,
  }
}
