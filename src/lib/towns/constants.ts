export type TownSlug = 'airlie-beach'

export interface TownHighlight {
  slug: string
  title: string
  description: string
  emoji: string
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

export const TOWNS: Record<TownSlug, Town> = {
  'airlie-beach': {
    slug: 'airlie-beach',
    name: 'Airlie Beach',
    region: 'Whitsundays',
    state: 'QLD',
    tagline: 'Gateway to the Great Barrier Reef',
    welcomeLead: 'You made it to paradise.',
    welcomeBody:
      'Airlie Beach is your launchpad for island hops, reef days, and van-life essentials. Your DriftPass covers local perks, traveller utilities, and member rates with founding partners along the esplanade.',
    mapCenter: { lat: -20.2688, lng: 148.7175 },
    highlights: [
      {
        slug: 'whitehaven',
        title: 'Whitehaven Beach',
        description: 'Powder-white silica sand and turquoise water — the Whitsundays icon.',
        emoji: '🏖️',
        href: '/perks',
      },
      {
        slug: 'hill-inlet',
        title: 'Hill Inlet Lookout',
        description: 'Swirling sand and water views from Whitsunday Island.',
        emoji: '🌊',
        href: '/perks',
      },
      {
        slug: 'reef-day',
        title: 'Great Barrier Reef day trips',
        description: 'Snorkel and dive tours departing from Airlie Beach marina.',
        emoji: '🐠',
        href: '/perks',
      },
      {
        slug: 'sunset-cruise',
        title: 'Sunset sails',
        description: 'Evening cruises around the islands with drinks and views.',
        emoji: '⛵',
        href: '/perks',
      },
    ],
    essentials: [
      {
        id: 'water',
        category: 'Van lifer',
        question: 'Where can I refill drinking water?',
        answer:
          'Frequent-Seas on The Esplanade offers bottle and van-tank refills. DriftPass members can buy a water refill pass in Trip Help and collect with a PIN.',
        utilityHref: '/trip-help/water-refill',
      },
      {
        id: 'wifi',
        category: 'Digital nomad',
        question: 'Where is the best WiFi for working?',
        answer:
          'Frequent-Seas is the go-to for fast WiFi, power, and coffee. Half-day coworking passes are available through Trip Help.',
        utilityHref: '/trip-help/coworking',
      },
      {
        id: 'coffee',
        category: 'Food & drink',
        question: 'Where do members get coffee deals?',
        answer:
          'Frequent-Seas and other founding partners offer member rates. Check Explore for live perks, or grab a marketplace coffee deal in Trip Help.',
        utilityHref: '/trip-help/marketplace/coffee-deals',
      },
      {
        id: 'showers',
        category: 'Traveller basics',
        question: 'Can I shower between check-out and my tour?',
        answer:
          'Yes — Le Shack offers clean shower facilities. Buy a shower pass in Trip Help and show your collection PIN at the counter.',
        utilityHref: '/trip-help/showers',
      },
      {
        id: 'luggage',
        category: 'Traveller basics',
        question: 'Where can I store my bags for the day?',
        answer:
          'Le Shack provides secure, CCTV-monitored luggage storage on Shute Harbour Rd. Purchase through Trip Help from $4 per bag.',
        utilityHref: '/trip-help/luggage-storage',
      },
      {
        id: 'parking',
        category: 'Van lifer',
        question: 'Where can I park overnight or for the day?',
        answer:
          'Street parking is limited near the esplanade. Many travellers use accommodation parking or ask their hostel. Check with your stay for van-height clearance — Shute Harbour Rd has several options.',
      },
      {
        id: 'laundry',
        category: 'Traveller basics',
        question: 'Is there laundry near town?',
        answer:
          'Le Shack runs wash-and-dry services with same-day turnaround. Member laundry passes are in Trip Help.',
        utilityHref: '/trip-help/laundry',
      },
      {
        id: 'getting-around',
        category: 'Getting around',
        question: 'How do I get around without a car?',
        answer:
          'The town strip is walkable. Le Shack hires scooters and bikes for marina runs and short trips. Transfers and hire details are in Trip Help.',
        utilityHref: '/trip-help/transfers',
      },
    ],
    sponsors: [
      { name: 'Airlie Beach Fit', slug: 'airlie-beach-fit', tagline: 'Fitness' },
      { name: 'Le Shack', slug: 'le-shack', tagline: 'Hire & storage' },
      { name: 'Frequent-Seas', slug: 'frequent-seas', tagline: 'Café & cowork' },
    ],
  },
}

export function getTown(slug: string): Town | undefined {
  return TOWNS[slug as TownSlug]
}

export function getTownSponsors(slug: TownSlug = 'airlie-beach'): TownSponsor[] {
  return TOWNS[slug].sponsors
}
