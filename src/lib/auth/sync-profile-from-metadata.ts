import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const TRAVELLER_TYPES = new Set(['backpacker', 'digital_nomad', 'van_lifer'])

/** Apply signup/OAuth metadata to profiles after auth callback. */
export async function syncProfileFromUserMetadata(
  admin: SupabaseClient<Database>,
  user: User
): Promise<void> {
  const meta = user.user_metadata ?? {}
  const { data: profile } = await admin
    .from('profiles')
    .select('traveller_type, avatar_url, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return

  const updates: Database['public']['Tables']['profiles']['Update'] = {}

  const travellerType = meta.traveller_type
  if (
    !profile.traveller_type &&
    typeof travellerType === 'string' &&
    TRAVELLER_TYPES.has(travellerType)
  ) {
    updates.traveller_type = travellerType
  }

  const avatarFromMeta =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    null

  if (!profile.avatar_url && avatarFromMeta) {
    updates.avatar_url = avatarFromMeta
  }

  const fullName = meta.full_name
  if (
    typeof fullName === 'string' &&
    fullName.trim() &&
    (!profile.full_name || profile.full_name === user.email?.split('@')[0])
  ) {
    updates.full_name = fullName.trim()
  }

  if (Object.keys(updates).length === 0) return

  const { error } = await admin.from('profiles').update(updates).eq('id', user.id)
  if (error) {
    console.error('[syncProfileFromUserMetadata] update failed:', error.message)
  }
}
