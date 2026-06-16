import type { PartnerHoursDay } from '@/lib/partners/detail'

export interface OpeningHoursRow {
  label: string
  hours: string
  open?: string
  close?: string
  /** 0 = Sunday … 6 = Saturday (JS Date.getDay()) */
  days?: number[]
}

export interface PartnerOpeningHoursData {
  rows: OpeningHoursRow[]
}

const FALLBACK_TIMEZONE = 'Australia/Brisbane'

export function parsePartnerOpeningHours(raw: unknown): PartnerOpeningHoursData | null {
  if (!raw || typeof raw !== 'object') return null
  const rows = (raw as PartnerOpeningHoursData).rows
  if (!Array.isArray(rows) || rows.length === 0) return null
  return { rows }
}

export function getPartnerHoursFromData(
  data: PartnerOpeningHoursData | null,
  fallbackRows: PartnerHoursDay[]
): PartnerHoursDay[] {
  if (!data?.rows?.length) return fallbackRows
  return data.rows.map((row) => ({ day: row.label, hours: row.hours }))
}

export function getPartnerHoursSummary(
  data: PartnerOpeningHoursData | null,
  fallback: string
): string {
  if (!data?.rows?.length) return fallback
  if (data.rows.length === 1) return data.rows[0]?.hours ?? fallback
  return data.rows.map((row) => `${row.label}: ${row.hours}`).join(' · ')
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function getNowInTimezone(timezone: string): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: timezone || FALLBACK_TIMEZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date())

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon'
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return {
    day: dayMap[weekday] ?? 1,
    minutes: hour * 60 + minute,
  }
}

export function isPartnerOpenNowFromData(
  data: PartnerOpeningHoursData | null,
  timezone: string | null | undefined,
  fallbackOpen = true
): boolean {
  if (!data?.rows?.length) return fallbackOpen

  const tz = timezone || FALLBACK_TIMEZONE
  const { day, minutes } = getNowInTimezone(tz)

  for (const row of data.rows) {
    if (!row.days?.includes(day) || !row.open || !row.close) continue

    const openMinutes = parseTimeToMinutes(row.open)
    const closeMinutes = parseTimeToMinutes(row.close)
    if (openMinutes === null || closeMinutes === null) continue

    if (closeMinutes > openMinutes) {
      if (minutes >= openMinutes && minutes < closeMinutes) return true
    } else {
      // Overnight window (e.g. 22:00 – 02:00)
      if (minutes >= openMinutes || minutes < closeMinutes) return true
    }
  }

  return false
}
