import type { PartnerOpeningHoursData } from '@/lib/partners/opening-hours'
import {
  getPartnerHoursFromData,
  getPartnerHoursSummary,
  isPartnerOpenNowFromData,
  parsePartnerOpeningHours,
} from '@/lib/partners/opening-hours'
import type { PartnerCategory } from '@/types'

export interface PartnerHoursDay {
  day: string
  hours: string
}

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  gym_fitness: 'Fitness',
  cafe_cowork: 'Café',
  laundry: 'Laundry',
  luggage_storage: 'Storage',
  shower: 'Amenities',
  scooter_hire: 'Hire',
  water_fill: 'Utilities',
  accommodation: 'Stay',
  restaurant: 'Food',
  mechanic: 'Services',
  kitchen: 'Kitchen',
  ev_charging: 'EV',
  events: 'Events',
  tours: 'Tours',
  other: 'Partner',
}

const SLUG_HOURS: Record<string, PartnerHoursDay[]> = {
  'ailey-beach-fit': [
    { day: 'Mon – Fri', hours: '5:00 am – 9:00 pm' },
    { day: 'Sat – Sun', hours: '6:00 am – 7:00 pm' },
  ],
  frequencies: [{ day: 'Mon – Sun', hours: '7:00 am – 5:00 pm' }],
  'le-shack': [{ day: 'Mon – Sun', hours: '8:00 am – 6:00 pm' }],
  'frozen-yogurt-place': [{ day: 'Mon – Sun', hours: '10:00 am – 8:00 pm' }],
}

const DEFAULT_HOURS: PartnerHoursDay[] = [
  { day: 'Mon – Fri', hours: '9:00 am – 5:00 pm' },
  { day: 'Sat – Sun', hours: '10:00 am – 4:00 pm' },
]

const DEFAULT_TIMEZONE = 'Australia/Brisbane'

export function getPartnerCategoryLabel(category: PartnerCategory): string {
  return CATEGORY_LABELS[category] ?? 'Partner'
}

export function getPartnerOfferHeadline(
  discountLabel: string,
  primaryServiceName?: string | null
): string {
  if (!primaryServiceName) return discountLabel
  return `${discountLabel} · ${primaryServiceName.toLowerCase()}`
}

export function resolvePartnerOpeningHours(
  slug: string,
  openingHoursRaw: unknown,
  timezone?: string | null
): {
  rows: PartnerHoursDay[]
  summary: string
  isOpen: boolean
  timezone: string
  parsed: PartnerOpeningHoursData | null
} {
  const parsed = parsePartnerOpeningHours(openingHoursRaw)
  const fallbackRows = SLUG_HOURS[slug] ?? DEFAULT_HOURS
  const tz = timezone || DEFAULT_TIMEZONE
  const rows = getPartnerHoursFromData(parsed, fallbackRows)
  const summary = getPartnerHoursSummary(parsed, rows[0]?.hours ?? 'Hours vary')

  return {
    rows,
    summary,
    isOpen: isPartnerOpenNowFromData(parsed, tz, isPartnerOpenNowLegacy(slug, tz)),
    timezone: tz,
    parsed,
  }
}

/** @deprecated Use resolvePartnerOpeningHours — kept for call sites migrating gradually */
export function getPartnerHours(slug: string, openingHoursRaw?: unknown): PartnerHoursDay[] {
  return resolvePartnerOpeningHours(slug, openingHoursRaw).rows
}

/** @deprecated Use resolvePartnerOpeningHours */
export function isPartnerOpenNow(
  slug: string,
  openingHoursRaw?: unknown,
  timezone?: string | null
): boolean {
  return resolvePartnerOpeningHours(slug, openingHoursRaw, timezone).isOpen
}

function isPartnerOpenNowLegacy(slug: string, timezone: string): boolean {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date())

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '12')
  const isWeekend = weekday === 'Sat' || weekday === 'Sun'

  if (slug === 'ailey-beach-fit') {
    return isWeekend ? hour >= 6 && hour < 19 : hour >= 5 && hour < 21
  }
  if (slug === 'frequencies') return hour >= 7 && hour < 17
  if (slug === 'le-shack') return hour >= 8 && hour < 18
  if (slug === 'frozen-yogurt-place') return hour >= 10 && hour < 20

  return isWeekend ? hour >= 10 && hour < 16 : hour >= 9 && hour < 17
}

export function getPartnerMapUrl(lat: number, lng: number): string {
  const delta = 0.012
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

export function getPartnerDirectionsUrl(lat: number, lng: number, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}&query_place_id=${encodeURIComponent(name)}`
}
