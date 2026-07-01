export interface TripTour {
  slug: string
  title: string
  description: string
  longDescription: string
  features: string[]
  priceLabel: string
  priceSubtext: string
  emoji: string
  partnerSlug: string
  partnerDisplayName: string
  hoursLabel: string
  meetingNote: string
}

export const TRIP_TOURS: TripTour[] = [
  {
    slug: 'reef-snorkel-day',
    title: 'Reef Snorkel Day',
    description: 'Full-day Outer Reef trip with snorkelling',
    longDescription:
      'Join Whitsunday Reef Adventures at Port of Airlie marina for a full-day trip to the Outer Great Barrier Reef. Includes snorkelling gear, reef briefing, lunch, and return transfers from the marina.',
    features: [
      'Outer Reef snorkelling',
      'Gear & wetsuit included',
      'Lunch on board',
      'Marina check-in 7:30 am',
    ],
    priceLabel: '$89',
    priceSubtext: 'per person',
    emoji: '🐠',
    partnerSlug: 'whitsunday-reef-adventures',
    partnerDisplayName: 'Whitsunday Reef Adventures',
    hoursLabel: 'Trips depart daily · 7:30 am check-in',
    meetingNote: 'Check in at the operator desk before departure.',
  },
  {
    slug: 'island-day-sail',
    title: 'Island Day Sail',
    description: 'Whitehaven Beach & Hill Inlet day sail',
    longDescription:
      'Sail with Coral Sea Sailing from Coral Sea Marina through the Whitsundays to Whitehaven Beach and Hill Inlet lookout. A full day on the water with snorkel stops and a beach picnic.',
    features: [
      'Whitehaven Beach stop',
      'Hill Inlet lookout walk',
      'Snorkel gear included',
      'Lunch & refreshments',
    ],
    priceLabel: '$120',
    priceSubtext: 'per person',
    emoji: '⛵',
    partnerSlug: 'coral-sea-sailing',
    partnerDisplayName: 'Coral Sea Sailing',
    hoursLabel: 'Trips depart daily · 8:00 am',
    meetingNote: 'Meet at the Coral Sea Sailing office on the marina.',
  },
  {
    slug: 'sunset-sail',
    title: 'Sunset Sail',
    description: 'Golden-hour cruise through the islands',
    longDescription:
      'An evening sail with Coral Sea Sailing — golden light, island views, and a relaxed drink on deck. Perfect after a day in town or before dinner on the esplanade.',
    features: [
      '2.5 hour sunset cruise',
      'Complimentary drink',
      'Small group vessel',
      'Departs Coral Sea Marina',
    ],
    priceLabel: '$65',
    priceSubtext: 'per person',
    emoji: '🌅',
    partnerSlug: 'coral-sea-sailing',
    partnerDisplayName: 'Coral Sea Sailing',
    hoursLabel: 'Daily departure · 4:30 pm',
    meetingNote: 'Arrive 15 minutes before departure for boarding.',
  },
]

export function getTripTour(slug: string): TripTour | undefined {
  return TRIP_TOURS.find((tour) => tour.slug === slug)
}

export const TRIP_TOUR_SLUGS = TRIP_TOURS.map((tour) => tour.slug)
