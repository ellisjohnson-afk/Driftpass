import {
  getTripUtility,
  TRIP_MARKETPLACE,
  type TripUtility,
  type TripUtilitySlug,
} from '@/lib/trip-help/constants'

import type { PurchasableProductType } from '@/lib/orders/types'

export interface PurchasableProduct {
  type: PurchasableProductType
  slug: string
  name: string
  description: string
  priceAudCents: number
  partnerSlug: string
  serviceType: string | null
  expiryHours: number
  stripeProductName: string
}

const UTILITY_PRICING: Record<
  TripUtilitySlug,
  { priceAudCents: number | null; expiryHours: number }
> = {
  'luggage-storage': { priceAudCents: 400, expiryHours: 24 },
  showers: { priceAudCents: 500, expiryHours: 12 },
  laundry: { priceAudCents: 800, expiryHours: 24 },
  coworking: { priceAudCents: 1200, expiryHours: 8 },
  'water-refill': { priceAudCents: 400, expiryHours: 24 },
  transfers: { priceAudCents: null, expiryHours: 0 },
}

const MARKETPLACE_PRICING: Record<string, { priceAudCents: number; partnerSlug: string; serviceType: string | null; expiryHours: number }> = {
  'gym-day-pass': {
    priceAudCents: 599,
    partnerSlug: 'airlie-beach-fit',
    serviceType: 'gym_day_pass',
    expiryHours: 24,
  },
  'coffee-deals': {
    priceAudCents: 299,
    partnerSlug: 'frequent-seas',
    serviceType: 'coffee',
    expiryHours: 12,
  },
}

function utilityToProduct(utility: TripUtility): PurchasableProduct | null {
  const pricing = UTILITY_PRICING[utility.slug]
  if (!pricing?.priceAudCents) return null

  return {
    type: 'trip_help',
    slug: utility.slug,
    name: utility.label,
    description: utility.tagline,
    priceAudCents: pricing.priceAudCents,
    partnerSlug: utility.partnerSlug,
    serviceType: utility.serviceType,
    expiryHours: pricing.expiryHours,
    stripeProductName: `${utility.label} · DriftPass Trip Help`,
  }
}

export function getPurchasableTripHelpProduct(slug: string): PurchasableProduct | null {
  const utility = getTripUtility(slug)
  if (!utility) return null
  return utilityToProduct(utility)
}

export function getPurchasableMarketplaceProduct(slug: string): PurchasableProduct | null {
  const item = TRIP_MARKETPLACE.find((entry) => entry.slug === slug)
  const pricing = MARKETPLACE_PRICING[slug]
  if (!item || !pricing) return null

  return {
    type: 'marketplace',
    slug: item.slug,
    name: item.title,
    description: item.description,
    priceAudCents: pricing.priceAudCents,
    partnerSlug: pricing.partnerSlug,
    serviceType: pricing.serviceType,
    expiryHours: pricing.expiryHours,
    stripeProductName: `${item.title} · DriftPass`,
  }
}

export function getPurchasableProduct(
  type: PurchasableProductType,
  slug: string
): PurchasableProduct | null {
  if (type === 'trip_help') return getPurchasableTripHelpProduct(slug)
  return getPurchasableMarketplaceProduct(slug)
}

export function computeOrderExpiry(expiryHours: number): Date {
  return new Date(Date.now() + expiryHours * 60 * 60 * 1000)
}
