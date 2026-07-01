import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type DbClient = SupabaseClient<Database>

export type AdminPartnerRow = Database['public']['Tables']['partners']['Row'] & {
  partner_services: { id: string; name: string; is_active: boolean }[]
}

export async function fetchAllPartnersForAdmin(client: DbClient): Promise<AdminPartnerRow[]> {
  const { data, error } = await client
    .from('partners')
    .select('*, partner_services(id, name, is_active)')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as AdminPartnerRow[]
}
