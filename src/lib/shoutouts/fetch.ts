import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getPerkImageUrl } from '@/lib/perks/constants'
import type { PartnerCategory } from '@/types'
import type {
  FeaturedShoutoutDisplay,
  FeaturedShoutoutWithPartner,
  ShoutoutPlacement,
} from '@/lib/shoutouts/types'

type DbClient = SupabaseClient<Database>

function isWithinSchedule(row: {
  starts_at: string | null
  ends_at: string | null
}): boolean {
  const now = Date.now()
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false
  if (row.ends_at && new Date(row.ends_at).getTime() <= now) return false
  return true
}

export function toShoutoutDisplay(row: FeaturedShoutoutWithPartner): FeaturedShoutoutDisplay {
  const partner = row.partners
  const fallbackImage = partner
    ? getPerkImageUrl(partner.slug, partner.category as PartnerCategory)
    : 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80'

  return {
    id: row.id,
    businessName: row.business_name,
    headline: row.headline,
    body: row.body,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    imageUrl: row.image_url ?? fallbackImage,
  }
}

export async function fetchActiveShoutouts(
  client: DbClient,
  options: {
    placement: ShoutoutPlacement
    townSlug?: string
    limit?: number
  }
): Promise<FeaturedShoutoutDisplay[]> {
  let query = client
    .from('featured_shoutouts')
    .select('*, partners(slug, category)')
    .eq('placement', options.placement)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 3)

  if (options.townSlug) {
    query = query.eq('town_slug', options.townSlug)
  }

  const { data, error } = await query
  if (error) {
    if (error.code === '42P01') return []
    throw new Error(error.message)
  }

  return (data ?? [])
    .filter((row) => isWithinSchedule(row))
    .map((row) => toShoutoutDisplay(row as FeaturedShoutoutWithPartner))
}

export async function fetchAllShoutoutsForAdmin(
  client: DbClient
): Promise<FeaturedShoutoutWithPartner[]> {
  const { data, error } = await client
    .from('featured_shoutouts')
    .select('*, partners(slug, category)')
    .order('placement', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as FeaturedShoutoutWithPartner[]
}
