import type { OrderProductType } from '@/lib/orders/types'

export type TripHelpProductSection = 'utilities' | 'marketplace'

export interface TripHelpProductRow {
  id: string
  product_type: OrderProductType
  section: TripHelpProductSection
  slug: string
  name: string
  short_label: string | null
  tagline: string | null
  description: string
  features: string[]
  partner_id: string | null
  service_type: string | null
  price_aud_cents: number | null
  expiry_hours: number
  price_label: string
  price_subtext: string | null
  hours_label: string | null
  meeting_note: string | null
  emoji: string | null
  hub_slug: string | null
  sort_order: number
  is_active: boolean
  is_purchasable: boolean
  created_at: string
  updated_at: string
}

export type TripHelpProductWithPartner = TripHelpProductRow & {
  partners: { id: string; name: string; slug: string } | null
}

export interface TripHelpProductDisplay {
  slug: string
  productType: OrderProductType
  section: TripHelpProductSection
  label: string
  shortLabel: string
  tagline: string | null
  description: string
  features: string[]
  partnerSlug: string
  partnerDisplayName: string
  serviceType: string | null
  priceLabel: string
  priceSubtext: string | null
  hoursLabel: string | null
  meetingNote: string | null
  emoji: string | null
  hubSlug: string | null
  isPurchasable: boolean
  priceAudCents: number | null
  expiryHours: number
}

export function toTripHelpProductDisplay(row: TripHelpProductWithPartner): TripHelpProductDisplay {
  return {
    slug: row.slug,
    productType: row.product_type,
    section: row.section,
    label: row.name,
    shortLabel: row.short_label ?? row.name,
    tagline: row.tagline,
    description: row.description,
    features: row.features ?? [],
    partnerSlug: row.partners?.slug ?? '',
    partnerDisplayName: row.partners?.name ?? '',
    serviceType: row.service_type,
    priceLabel: row.price_label,
    priceSubtext: row.price_subtext,
    hoursLabel: row.hours_label,
    meetingNote: row.meeting_note,
    emoji: row.emoji,
    hubSlug: row.hub_slug,
    isPurchasable: row.is_purchasable && row.price_aud_cents != null && row.price_aud_cents > 0,
    priceAudCents: row.price_aud_cents,
    expiryHours: row.expiry_hours,
  }
}
