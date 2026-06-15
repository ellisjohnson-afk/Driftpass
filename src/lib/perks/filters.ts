import type { PartnerCategory } from '@/types'
import { PERK_FILTERS, type PerkFilterId } from './constants'

export interface PerkPartnerRecord {
  id: string
  name: string
  slug: string
  category: PartnerCategory
  city: string
  serviceTypes: string[]
}

export function partnerMatchesFilter(
  partner: PerkPartnerRecord,
  filterId: PerkFilterId
): boolean {
  if (filterId === 'all') return true

  const filter = PERK_FILTERS.find((item) => item.id === filterId)
  if (!filter?.categories) return true

  if (!filter.categories.includes(partner.category)) return false

  if (!filter.serviceTypes?.length) return true

  return filter.serviceTypes.some((type) => partner.serviceTypes.includes(type))
}

export function filterPerksBySearch<T extends { name: string; city: string }>(
  perks: T[],
  query: string
): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return perks

  return perks.filter((perk) => {
    const haystack = `${perk.name} ${perk.city}`.toLowerCase()
    return haystack.includes(normalized)
  })
}
