import { fetchCatalogProductsForPartner } from '@/lib/trip-help/fetch-products'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

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

export async function buildPartnerOnboardingChecklist(
  client: SupabaseClient<Database>,
  partner: PartnerInput
): Promise<PartnerOnboardingChecklist> {
  const activeServices = partner.partner_services.filter((service) => service.is_active)
  const hasPayoutConfigured = activeServices.some((service) => service.aud_payout_cents > 0)
  const profileComplete = Boolean(partner.name.trim() && partner.address.trim() && partner.slug.trim())

  let catalogProducts: PartnerCatalogProduct[] = []
  try {
    const products = await fetchCatalogProductsForPartner(client, partner.slug)
    catalogProducts = products.map((product) => ({
      type: product.productType,
      slug: product.slug,
      name: product.label,
      priceAudCents: product.priceAudCents ?? 0,
    }))
  } catch {
    // Migration 018 may not be applied yet
  }

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
