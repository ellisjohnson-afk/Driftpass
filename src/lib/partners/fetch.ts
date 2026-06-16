import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type AdminClient = SupabaseClient<Database>

const PARTNER_HOURS_COLUMNS = 'timezone, opening_hours' as const

export type PartnerHoursFields = {
  timezone: string | null
  opening_hours: unknown
}

/**
 * Fetches a partner row, including opening-hours columns when migration 008 is applied.
 * Falls back to a base select so pages keep working before the migration runs.
 */
export async function fetchPartnerBySlug<T extends Record<string, unknown>>(
  admin: AdminClient,
  slug: string,
  baseSelect: string
): Promise<{ data: (T & PartnerHoursFields) | null; error: Error | null }> {
  const withHoursSelect = `${baseSelect}, ${PARTNER_HOURS_COLUMNS}`

  const withHours = await admin
    .from('partners')
    .select(withHoursSelect)
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!withHours.error) {
    return { data: withHours.data as (T & PartnerHoursFields) | null, error: null }
  }

  const message = withHours.error.message ?? ''
  const missingHoursColumns =
    message.includes('timezone') ||
    message.includes('opening_hours') ||
    withHours.error.code === '42703'

  if (!missingHoursColumns) {
    return { data: null, error: withHours.error }
  }

  const base = await admin
    .from('partners')
    .select(baseSelect)
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (base.error) {
    return { data: null, error: base.error }
  }

  return {
    data: base.data
      ? ({
          ...(base.data as unknown as T),
          timezone: null,
          opening_hours: null,
        } as T & PartnerHoursFields)
      : null,
    error: null,
  }
}
