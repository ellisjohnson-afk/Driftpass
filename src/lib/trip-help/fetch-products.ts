import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { OrderProductType } from '@/lib/orders/types'
import type { PurchasableProduct } from '@/lib/orders/catalog'
import {
  toTripHelpProductDisplay,
  type TripHelpProductDisplay,
  type TripHelpProductSection,
  type TripHelpProductWithPartner,
} from '@/lib/trip-help/product-types'

type DbClient = SupabaseClient<Database>

const PRODUCT_SELECT = `*, partners(id, name, slug)`

export async function fetchActiveTripHelpProducts(
  client: DbClient,
  options?: { section?: TripHelpProductSection; hubSlug?: string }
): Promise<TripHelpProductDisplay[]> {
  let query = client
    .from('trip_help_products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (options?.section) {
    query = query.eq('section', options.section)
  }

  if (options?.hubSlug) {
    query = query.eq('hub_slug', options.hubSlug)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data as TripHelpProductWithPartner[]).map(toTripHelpProductDisplay)
}

export async function fetchTripHelpProductBySlug(
  client: DbClient,
  slug: string,
  options?: { includeInactive?: boolean }
): Promise<TripHelpProductWithPartner | null> {
  let query = client.from('trip_help_products').select(PRODUCT_SELECT).eq('slug', slug)

  if (!options?.includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  return (data as TripHelpProductWithPartner | null) ?? null
}

export async function fetchAllTripHelpProductsForAdmin(
  client: DbClient
): Promise<TripHelpProductWithPartner[]> {
  const { data, error } = await client
    .from('trip_help_products')
    .select(PRODUCT_SELECT)
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as TripHelpProductWithPartner[]
}

export function toPurchasableProduct(row: TripHelpProductWithPartner): PurchasableProduct | null {
  if (!row.is_purchasable || !row.price_aud_cents || row.price_aud_cents <= 0) {
    return null
  }

  const partnerSlug = row.partners?.slug
  if (!partnerSlug) return null

  const displayName = row.name
  const stripeSuffix = row.product_type === 'trip_help' ? 'DriftPass Trip Help' : 'DriftPass'

  return {
    type: row.product_type as OrderProductType,
    slug: row.slug,
    name: displayName,
    description: row.tagline ?? row.description,
    priceAudCents: row.price_aud_cents,
    partnerSlug,
    serviceType: row.service_type,
    expiryHours: row.expiry_hours,
    stripeProductName: `${displayName} · ${stripeSuffix}`,
  }
}

export async function fetchPurchasableProduct(
  client: DbClient,
  productType: OrderProductType,
  slug: string
): Promise<PurchasableProduct | null> {
  const row = await fetchTripHelpProductBySlug(client, slug)
  if (!row || row.product_type !== productType) return null
  return toPurchasableProduct(row)
}

export async function fetchCatalogProductsForPartner(
  client: DbClient,
  partnerSlug: string
): Promise<TripHelpProductDisplay[]> {
  const { data, error } = await client
    .from('trip_help_products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .eq('is_purchasable', true)
    .not('price_aud_cents', 'is', null)

  if (error) throw new Error(error.message)

  return (data as TripHelpProductWithPartner[])
    .filter((row) => row.partners?.slug === partnerSlug)
    .map(toTripHelpProductDisplay)
}
