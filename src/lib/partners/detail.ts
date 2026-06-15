import type { PartnerCategory } from '@/types'

export interface PartnerHoursDay {
  day: string
  hours: string
}

export interface PartnerHoursSchedule {
  days: PartnerHoursDay[]
  /** IANA timezone for open-now checks */
  timezone: string
  /** 24h open/close for weekdays, used when no per-slug schedule */
  weekdayOpen: number
  weekdayClose: number
  weekendOpen: number
  weekendClose: number
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
  frequencies: [
    { day: 'Mon – Sun', hours: '7:00 am – 5:00 pm' },
  ],
  'le-shack': [
    { day: 'Mon – Sun', hours: '8:00 am – 6:00 pm' },
  ],
  'frozen-yogurt-place': [
    { day: 'Mon – Sun', hours: '10:00 am – 8:00 pm' },
  ],
}

const DEFAULT_HOURS: PartnerHoursDay[] = [
  { day: 'Mon – Fri', hours: '9:00 am – 5:00 pm' },
  { day: 'Sat – Sun', hours: '10:00 am – 4:00 pm' },
]

const QLD_SCHEDULE: PartnerHoursSchedule = {
  days: DEFAULT_HOURS,
  timezone: 'Australia/Brisbane',
  weekdayOpen: 9,
  weekdayClose: 17,
  weekendOpen: 10,
  weekendClose: 16,
}

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

export function getPartnerHours(slug: string): PartnerHoursDay[] {
  return SLUG_HOURS[slug] ?? DEFAULT_HOURS
}

export function isPartnerOpenNow(slug: string, schedule: PartnerHoursSchedule = QLD_SCHEDULE): boolean {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: schedule.timezone,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now)

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '12')
  const isWeekend = weekday === 'Sat' || weekday === 'Sun'

  const open = isWeekend ? schedule.weekendOpen : schedule.weekdayOpen
  const close = isWeekend ? schedule.weekendClose : schedule.weekdayClose

  const slugHours = SLUG_HOURS[slug]
  if (slugHours) {
    if (slug === 'ailey-beach-fit') {
      return isWeekend ? hour >= 6 && hour < 19 : hour >= 5 && hour < 21
    }
    if (slug === 'frequencies' || slug === 'le-shack') {
      return hour >= 7 && hour < (slug === 'le-shack' ? 18 : 17)
    }
    if (slug === 'frozen-yogurt-place') {
      return hour >= 10 && hour < 20
    }
  }

  return hour >= open && hour < close
}

export function getPartnerMapUrl(lat: number, lng: number): string {
  const delta = 0.012
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

export function getPartnerDirectionsUrl(lat: number, lng: number, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}&query_place_id=${encodeURIComponent(name)}`
}
