import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkUserIsAdmin } from '@/lib/admin/check-is-admin'

export async function requireAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  const isAdmin = await checkUserIsAdmin(user.id)
  if (!isAdmin) {
    redirect('/account?admin=denied')
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin, full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  return { user, profile }
}
