export type TownSlug = 'airlie-beach'

export interface TownHighlight {
  slug: string
  title: string
  description: string
  emoji: string
  imageUrl?: string
  href?: string
}

export interface TownEssentialFaq {
  id: string
  category: string
  question: string
  answer: string
  utilityHref?: string
}

export interface TownSponsor {
  name: string
  slug: string
  tagline?: string
}

export interface Town {
  slug: TownSlug
  name: string
  region: string
  state: string
  tagline: string
  welcomeLead: string
  welcomeBody: string
  mapCenter: { lat: number; lng: number }
  highlights: TownHighlight[]
  essentials: TownEssentialFaq[]
  sponsors: TownSponsor[]
}

const WHITSUNDAY_IMAGES = {
  beach:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  inlet:
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
  reef:
    'https://images.unsplash.com/photo-1544551763-77ef2d0cfcb0?auto=format&fit=crop&w=800&q=80',
  sail:
    'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?auto=format&fit=crop&w=800&q=80',
} as const

export const TOWNS: Record<TownSlug, Town> = {
  'airlie-beach': {
    slug: 'airlie-beach',
    name: 'Airlie Beach',
    region: 'Whitsundays',
    state: 'QLD',
    tagline: 'Gateway to the Great Barrier Reef',
    welcomeLead: 'Paradise starts here.',
    welcomeBody:
      'Whether you just hopped off the bus or sailed in on a yacht, Airlie is where the Whitsundays begin. Use your DriftPass for founding partner discounts, book traveller essentials in Trip Help, and show your PIN when you arrive.',
    mapCenter: { lat: -20.2688, lng: 148.7175 },
    highlights: [
      {
        slug: 'whitehaven',
        title: 'Whitehaven Beach',
        description:
          'Seventy kilometres of powder-white silica sand — consistently ranked among the world\'s best beaches.',
        emoji: '🏖️',
        imageUrl: WHITSUNDAY_IMAGES.beach,
        href: '/trip-help/marketplace/reef-snorkel-day',
      },
      {
        slug: 'hill-inlet',
        title: 'Hill Inlet & Heart Reef',
        description:
          'The classic Whitsunday swirl — best from a day sail or scenic flight over the islands.',
        emoji: '🌊',
        imageUrl: WHITSUNDAY_IMAGES.inlet,
        href: '/trip-help/marketplace/island-day-sail',
      },
      {
        slug: 'reef-day',
        title: 'Reef snorkel & dive days',
        description:
          'Full-day trips from the marina to the Outer Reef. Book with Whitsunday Reef Adventures in Trip Help.',
        emoji: '🐠',
        imageUrl: WHITSUNDAY_IMAGES.reef,
        href: '/trip-help/marketplace/reef-snorkel-day',
      },
      {
        slug: 'sunset-cruise',
        title: 'Sunset sails',
        description:
          'Golden-hour cruises through the islands with Coral Sea Sailing — book in Trip Help.',
        emoji: '⛵',
        imageUrl: WHITSUNDAY_IMAGES.sail,
        href: '/trip-help/marketplace/sunset-sail',
      },
    ],
    essentials: [
      {
        id: 'water',
        category: 'Van lifer',
        question: 'Where can I refill drinking water?',
        answer:
          'Head to Frequent-Seas on The Esplanade — bottle refills and van tanks welcome. Buy a Trip Help water pass online and collect with your PIN at the counter.',
        utilityHref: '/trip-help/water-refill',
      },
      {
        id: 'wifi',
        category: 'Digital nomad',
        question: 'Best spot to work with WiFi?',
        answer:
          'Frequent-Seas is the local favourite: fast WiFi, power at every seat. Grab a half-day coworking pass through Trip Help.',
        utilityHref: '/trip-help/coworking',
      },
      {
        id: 'tours',
        category: 'Experiences',
        question: 'How do I book tours and activities?',
        answer:
          'Browse Tours in Explore or Trip Help for reef days, sails, and island trips. Featured partners and paid experiences help keep membership free.',
        utilityHref: '/trip-help/marketplace/tours-experiences',
      },
      {
        id: 'showers',
        category: 'Traveller basics',
        question: 'Need a shower between check-out and a tour?',
        answer:
          'Le Shack on Shute Harbour Rd has clean showers — ideal between hostel check-out and an afternoon sail. Buy a pass in Trip Help, then show your collection PIN.',
        utilityHref: '/trip-help/showers',
      },
      {
        id: 'luggage',
        category: 'Traveller basics',
        question: 'Where can I stash my bags for the day?',
        answer:
          'Le Shack runs secure, CCTV-monitored storage on Shute Harbour Rd. From $4 per bag — purchase in Trip Help and collect with your PIN.',
        utilityHref: '/trip-help/luggage-storage',
      },
      {
        id: 'parking',
        category: 'Van lifer',
        question: 'Parking for vans and cars?',
        answer:
          'Street parking near the lagoon and esplanade fills up fast. Ask your hostel or campsite first. For larger rigs, check height limits on Shute Harbour Rd — several lots suit day parking.',
      },
      {
        id: 'laundry',
        category: 'Traveller basics',
        question: 'Laundry in town?',
        answer:
          'Le Shack offers wash-and-dry with same-day turnaround. Trip Help laundry passes make it one less thing to think about.',
        utilityHref: '/trip-help/laundry',
      },
      {
        id: 'getting-around',
        category: 'Getting around',
        question: 'Getting around without a car?',
        answer:
          'The main strip is walkable in minutes. For the marina or further out, Le Shack hires scooters and bikes. See Trip Help for hire details and member rates.',
        utilityHref: '/trip-help/transfers',
      },
    ],
    sponsors: [
      { name: 'Airlie Beach Fit', slug: 'airlie-beach-fit', tagline: 'Gym & fitness' },
      { name: 'Le Shack', slug: 'le-shack', tagline: 'Storage & hire' },
      { name: 'Frequent-Seas', slug: 'frequent-seas', tagline: 'Café & cowork' },
      { name: 'Frozen Yogurt Place', slug: 'frozen-yogurt-place', tagline: 'Treats & smoothies' },
    ],
  },
}

export function getTown(slug: string): Town | undefined {
  return TOWNS[slug as TownSlug]
}

export function getTownSponsors(slug: TownSlug = 'airlie-beach'): TownSponsor[] {
  return TOWNS[slug].sponsors
}
