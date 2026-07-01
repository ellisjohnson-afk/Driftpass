import type { PartnerCategory } from '@/types'

export type PerkFilterId = 'all' | 'gym' | 'tours' | 'food' | 'coworking'

export interface PerkFilter {
  id: PerkFilterId
  label: string
  categories?: PartnerCategory[]
  serviceTypes?: string[]
}

export const PERK_FILTERS: PerkFilter[] = [
  { id: 'all', label: 'All' },
  { id: 'gym', label: 'Gym', categories: ['gym_fitness'] },
  { id: 'tours', label: 'Tours', categories: ['tours', 'events', 'scooter_hire'] },
  { id: 'food', label: 'Food', categories: ['restaurant', 'kitchen'] },
  {
    id: 'coworking',
    label: 'Coworking',
    categories: ['cafe_cowork'],
    serviceTypes: ['coworking'],
  },
]

/** Partners monetised via Trip Help upsells — not shown as free Explore perks */
export const EXPLORE_EXCLUDED_PARTNER_SLUGS = new Set(['frequent-seas'])

const CATEGORY_DISCOUNT: Partial<Record<PartnerCategory, string>> = {
  gym_fitness: '20% off',
  cafe_cowork: '15% off',
  restaurant: '20% off',
  kitchen: '15% off',
  tours: '25% off',
  events: '20% off',
  scooter_hire: 'Member rate',
  laundry: 'Member rate',
  luggage_storage: 'Member rate',
  shower: 'Member rate',
  accommodation: '15% off',
  mechanic: '10% off',
  ev_charging: 'Member rate',
  water_fill: 'Free',
  other: 'Member perk',
}

const SLUG_DISCOUNT: Record<string, string> = {
  'airlie-beach-fit': '20% off',
  'le-shack': 'Member rate',
  'frozen-yogurt-place': '20% off',
  'whitsunday-reef-adventures': 'Member rate',
  'coral-sea-sailing': 'Member rate',
}

const CATEGORY_IMAGE: Partial<Record<PartnerCategory, string>> = {
  gym_fitness:
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
  cafe_cowork:
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
  restaurant:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  kitchen:
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
  tours:
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80',
  events:
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80',
  scooter_hire:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
  laundry:
    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80',
  luggage_storage:
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
  shower:
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  accommodation:
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  mechanic:
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80',
  ev_charging:
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80',
  water_fill:
    'https://images.unsplash.com/photo-1548839140-29a7492991bd?auto=format&fit=crop&w=600&q=80',
  other:
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
}

const SLUG_IMAGE: Record<string, string> = {
  'airlie-beach-fit':
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=600&q=80',
  'frequent-seas':
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80',
  'le-shack':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
  'frozen-yogurt-place':
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
  'whitsunday-reef-adventures':
    'https://images.unsplash.com/photo-1544551763-77ef2d0cfcb0?auto=format&fit=crop&w=600&q=80',
  'coral-sea-sailing':
    'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?auto=format&fit=crop&w=600&q=80',
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80'

export function getPerkDiscountLabel(slug: string, category: PartnerCategory): string {
  return SLUG_DISCOUNT[slug] ?? CATEGORY_DISCOUNT[category] ?? 'Member perk'
}

export function getPerkImageUrl(slug: string, category: PartnerCategory): string {
  return SLUG_IMAGE[slug] ?? CATEGORY_IMAGE[category] ?? DEFAULT_IMAGE
}

