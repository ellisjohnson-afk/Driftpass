import { createAdminClient } from '@/lib/supabase/admin'

export async function checkUserIsAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()

  return data?.is_admin === true
}
