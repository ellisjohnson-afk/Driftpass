import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import {
  fetchPurchasableProduct,
  toPurchasableProduct,
} from '@/lib/trip-help/fetch-products'
import { fetchTripHelpProductBySlug } from '@/lib/trip-help/fetch-products'
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

type DbClient = SupabaseClient<Database>

export async function getPurchasableProduct(
  client: DbClient,
  type: PurchasableProductType,
  slug: string
): Promise<PurchasableProduct | null> {
  return fetchPurchasableProduct(client, type, slug)
}

export async function getPurchasableTripHelpProduct(
  client: DbClient,
  slug: string
): Promise<PurchasableProduct | null> {
  return fetchPurchasableProduct(client, 'trip_help', slug)
}

export async function getPurchasableMarketplaceProduct(
  client: DbClient,
  slug: string
): Promise<PurchasableProduct | null> {
  return fetchPurchasableProduct(client, 'marketplace', slug)
}

export async function getPurchasableProductBySlug(
  client: DbClient,
  slug: string
): Promise<PurchasableProduct | null> {
  const row = await fetchTripHelpProductBySlug(client, slug)
  if (!row) return null
  return toPurchasableProduct(row)
}

export function computeOrderExpiry(expiryHours: number): Date {
  return new Date(Date.now() + expiryHours * 60 * 60 * 1000)
}
