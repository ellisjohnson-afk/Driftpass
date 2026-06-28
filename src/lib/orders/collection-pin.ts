import { randomInt } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type AdminClient = SupabaseClient<Database>

/** Generate a unique 6-digit collection PIN (not the rotating membership PIN). */
export async function generateCollectionPin(admin: AdminClient): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const pin = String(randomInt(100_000, 1_000_000))
    const { data } = await admin
      .from('order_vouchers')
      .select('id')
      .eq('collection_pin', pin)
      .maybeSingle()

    if (!data) return pin
  }

  throw new Error('Could not generate a unique collection PIN')
}

export function formatCollectionPin(pin: string): string {
  const digits = pin.replace(/\D/g, '').slice(0, 6)
  if (digits.length <= 3) return digits
  return `${digits.slice(0, 3)} ${digits.slice(3)}`
}
