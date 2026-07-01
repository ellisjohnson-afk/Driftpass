import type { PartnerCategory } from '@/types'

export const PARTNER_CATEGORIES: PartnerCategory[] = [
  'gym_fitness',
  'cafe_cowork',
  'laundry',
  'luggage_storage',
  'shower',
  'scooter_hire',
  'water_fill',
  'accommodation',
  'restaurant',
  'mechanic',
  'kitchen',
  'ev_charging',
  'events',
  'tours',
  'other',
]

export const PARTNER_CATEGORY_LABELS: Record<PartnerCategory, string> = {
  gym_fitness: 'Gym & fitness',
  cafe_cowork: 'Cafe & cowork',
  laundry: 'Laundry',
  luggage_storage: 'Luggage storage',
  shower: 'Shower',
  scooter_hire: 'Scooter hire',
  water_fill: 'Water fill',
  accommodation: 'Accommodation',
  restaurant: 'Restaurant',
  mechanic: 'Mechanic',
  kitchen: 'Kitchen',
  ev_charging: 'EV charging',
  events: 'Events',
  tours: 'Tours',
  other: 'Other',
}

export function formatPartnerCategory(category: string): string {
  return PARTNER_CATEGORY_LABELS[category as PartnerCategory] ?? category.replace(/_/g, ' ')
}
