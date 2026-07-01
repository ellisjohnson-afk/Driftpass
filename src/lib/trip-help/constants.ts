export type TripUtilitySlug =
  | 'luggage-storage'
  | 'showers'
  | 'laundry'
  | 'coworking'
  | 'water-refill'
  | 'transfers'

export interface TripUtility {
  slug: TripUtilitySlug
  label: string
  shortLabel: string
  tagline: string
  partnerSlug: string
  partnerDisplayName: string
  serviceType: string
  description: string
  features: string[]
  priceLabel: string
  priceSubtext: string
  hoursLabel: string
}

export const TRIP_UTILITIES: TripUtility[] = [
  {
    slug: 'luggage-storage',
    label: 'Luggage Storage',
    shortLabel: 'Luggage',
    tagline: 'Ditch your bags, explore the lagoon',
    partnerSlug: 'le-shack',
    partnerDisplayName: 'Le Shack',
    serviceType: 'luggage_storage',
    description:
      'Lockers on Shute Harbour Rd so you can swim, sail, or wander the esplanade bag-free. CCTV monitored, all sizes welcome — pay in Trip Help and collect with your PIN.',
    features: [
      '24/7 CCTV monitoring',
      'All bag sizes accepted',
      'Insurance included',
      'Easy PIN pickup',
    ],
    priceLabel: '$4',
    priceSubtext: 'per bag, per day',
    hoursLabel: 'Daily 8:00 am – 6:00 pm',
  },
  {
    slug: 'showers',
    label: 'Showers',
    shortLabel: 'Showers',
    tagline: 'Refresh between adventures',
    partnerSlug: 'le-shack',
    partnerDisplayName: 'Le Shack',
    serviceType: 'shower',
    description:
      'Hot showers when you need them — between hostel check-out, a bus connection, or a day on the water. Towels available at Le Shack.',
    features: ['Hot water', 'Private cubicles', 'Towels available', 'Member PIN access'],
    priceLabel: '$5',
    priceSubtext: 'per shower',
    hoursLabel: 'Daily 8:00 am – 6:00 pm',
  },
  {
    slug: 'laundry',
    label: 'Laundry',
    shortLabel: 'Laundry',
    tagline: 'Wash, dry, and keep moving',
    partnerSlug: 'le-shack',
    partnerDisplayName: 'Le Shack',
    serviceType: 'laundry',
    description:
      'Drop a load at Le Shack and explore while it dries. Same-day turnaround — handy for backpackers and van lifers passing through.',
    features: ['Wash & dry', 'Same-day turnaround', 'Eco detergent', 'Member PIN access'],
    priceLabel: '$8',
    priceSubtext: 'per load',
    hoursLabel: 'Daily 8:00 am – 6:00 pm',
  },
  {
    slug: 'coworking',
    label: 'Coworking',
    shortLabel: 'Coworking',
    tagline: 'WiFi, coffee & a quiet desk',
    partnerSlug: 'frequent-seas',
    partnerDisplayName: 'Frequent-Seas',
    serviceType: 'coworking',
    description:
      'Half-day desk access at Frequent-Seas on The Esplanade — fast WiFi, power, and coffee included. Built for nomads between island trips.',
    features: ['Fast WiFi', 'Power at every seat', 'Coffee included', 'Quiet work zone'],
    priceLabel: '$12',
    priceSubtext: 'half day',
    hoursLabel: 'Daily 7:00 am – 5:00 pm',
  },
  {
    slug: 'water-refill',
    label: 'Water Refill',
    shortLabel: 'Water',
    tagline: 'Top up your van tank',
    partnerSlug: 'frequent-seas',
    partnerDisplayName: 'Frequent-Seas',
    serviceType: 'water_fill',
    description:
      'Drinking water for bottles and van tanks at Frequent-Seas. Skip the petrol-station hunt — buy a refill pass and collect on the spot.',
    features: ['Drinking water', 'Van tank friendly', 'Quick fill', 'Member PIN access'],
    priceLabel: '$4',
    priceSubtext: 'per refill',
    hoursLabel: 'Daily 7:00 am – 5:00 pm',
  },
  {
    slug: 'transfers',
    label: 'Transfers',
    shortLabel: 'Transfers',
    tagline: 'Scooters, bikes, and local rides',
    partnerSlug: 'le-shack',
    partnerDisplayName: 'Le Shack',
    serviceType: 'scooter_hire',
    description:
      'Scooters and bikes from Le Shack — the easy way to reach the marina, lagoon, or your accommodation without a taxi.',
    features: ['Scooter hire', 'Bike hire', 'Helmets included', 'Town-wide coverage'],
    priceLabel: 'Member rate',
    priceSubtext: 'from Le Shack',
    hoursLabel: 'Daily 8:00 am – 6:00 pm',
  },
]

export interface MarketplaceItem {
  slug: string
  title: string
  description: string
  priceLabel: string
  emoji: string
  href: string
  partnerSlug: string
  partnerDisplayName: string
}

export const TRIP_MARKETPLACE: MarketplaceItem[] = [
  {
    slug: 'gym-day-pass',
    title: 'Gym Day Pass',
    description: 'Single visit at Airlie Beach Fit',
    priceLabel: '$5.99',
    emoji: '🏋️',
    href: '/trip-help/marketplace/gym-day-pass',
    partnerSlug: 'airlie-beach-fit',
    partnerDisplayName: 'Airlie Beach Fit',
  },
  {
    slug: 'tours-experiences',
    title: 'Tours & Experiences',
    description: 'Reef days, sails & island trips',
    priceLabel: 'From $65',
    emoji: '🚢',
    href: '/trip-help/marketplace/tours-experiences',
    partnerSlug: '',
    partnerDisplayName: '',
  },
]

export function getTripUtility(slug: string): TripUtility | undefined {
  return TRIP_UTILITIES.find((utility) => utility.slug === slug)
}
