import { format, formatDistanceToNow } from 'date-fns'

// Format AUD cents to display string
export function formatAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

// Format credits
export function formatCredits(credits: number): string {
  return `${credits} credit${credits !== 1 ? 's' : ''}`
}

// Format date
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy, h:mm a')
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// Calculate credit percentage used
export function creditPercentage(used: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

// Format distance in km
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
