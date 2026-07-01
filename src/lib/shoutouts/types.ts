export type ShoutoutPlacement = 'home' | 'trip_help' | 'explore' | 'town'

export interface FeaturedShoutout {
  id: string
  partner_id: string | null
  business_name: string
  headline: string
  body: string | null
  cta_label: string
  cta_href: string
  image_url: string | null
  placement: ShoutoutPlacement
  town_slug: string
  sort_order: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FeaturedShoutoutWithPartner extends FeaturedShoutout {
  partners: { slug: string; category: string } | null
}

export interface FeaturedShoutoutDisplay {
  id: string
  businessName: string
  headline: string
  body: string | null
  ctaLabel: string
  ctaHref: string
  imageUrl: string
}
