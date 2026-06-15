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
    tagline: 'Ditch your bags, explore freely',
    partnerSlug: 'le-shack',
    serviceType: 'luggage_storage',
    description:
      'Secure, monitored luggage storage so you can explore without carrying everything. CCTV monitored 24/7. Suitable for backpacks, suitcases, and oversized items.',
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
    serviceType: 'shower',
    description:
      'Clean shower facilities for travellers between buses, boats, and hostel check-ins. Towels available on request.',
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
    serviceType: 'laundry',
    description:
      'Drop a load while you grab coffee or explore the esplanade. Perfect for backpackers and van lifers on the move.',
    features: ['Wash & dry', 'Same-day turnaround', 'Eco detergent', 'Member PIN access'],
    priceLabel: '$8',
    priceSubtext: 'per load',
    hoursLabel: 'Daily 8:00 am – 6:00 pm',
  },
  {
    slug: 'coworking',
    label: 'Coworking',
    shortLabel: 'Coworking',
    tagline: 'Desk space with great WiFi',
    partnerSlug: 'frequencies',
    serviceType: 'coworking',
    description:
      'Half-day coworking with fast WiFi, power, and coffee on tap. Built for digital nomads passing through Airlie Beach.',
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
    partnerSlug: 'frequencies',
    serviceType: 'water_fill',
    description:
      'Refill drinking water for bottles and van tanks. Stay hydrated on the road without hunting for petrol stations.',
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
    serviceType: 'scooter_hire',
    description:
      'Hire scooters and bikes to get around Airlie Beach. Ideal for short transfers between accommodation, marina, and town.',
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
}

export const TRIP_MARKETPLACE: MarketplaceItem[] = [
  {
    slug: 'gym-day-pass',
    title: 'Gym Day Pass',
    description: 'Single gym visit',
    priceLabel: '$5.99',
    emoji: '🏋️',
    href: '/perks/ailey-beach-fit',
  },
  {
    slug: 'coffee-deals',
    title: 'Coffee Deals',
    description: 'Premium coffee offers',
    priceLabel: '$2.99',
    emoji: '☕',
    href: '/perks/frequencies',
  },
  {
    slug: 'tours-experiences',
    title: 'Tours & Experiences',
    description: 'Local guided experiences',
    priceLabel: 'From $20',
    emoji: '🚢',
    href: '/perks',
  },
]

export function getTripUtility(slug: string): TripUtility | undefined {
  return TRIP_UTILITIES.find((utility) => utility.slug === slug)
}
